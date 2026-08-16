-- Module 11: Customer orders + cafe order management.
-- Guest writes go through SECURITY DEFINER RPCs (server passes session id).
-- Staff manage orders via membership RLS. Anon has no direct table access.

-- ---------------------------------------------------------------------------
-- Enum
-- ---------------------------------------------------------------------------

create type public.order_status as enum (
  'pending',
  'confirmed',
  'preparing',
  'ready',
  'completed',
  'rejected'
);

-- ---------------------------------------------------------------------------
-- Per-cafe order number counter (starts at 1000 → first order #1001)
-- ---------------------------------------------------------------------------

create table public.cafe_order_counters (
  cafe_id uuid primary key references public.cafes (id) on delete cascade,
  last_number integer not null default 1000
    constraint cafe_order_counters_last_number_nonneg check (last_number >= 0)
);

alter table public.cafe_order_counters enable row level security;
alter table public.cafe_order_counters force row level security;
revoke all on table public.cafe_order_counters from anon, public, authenticated;

-- ---------------------------------------------------------------------------
-- orders
-- ---------------------------------------------------------------------------

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  cafe_id uuid not null references public.cafes (id) on delete restrict,
  table_id uuid not null references public.cafe_tables (id) on delete restrict,
  order_number integer not null,
  status public.order_status not null default 'pending',
  customer_session_id text not null,
  public_token text not null default replace(gen_random_uuid()::text, '-', ''),
  idempotency_key text not null,
  subtotal numeric(12, 2) not null,
  total numeric(12, 2) not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  confirmed_at timestamptz,
  preparing_at timestamptz,
  ready_at timestamptz,
  completed_at timestamptz,
  rejected_at timestamptz,
  constraint orders_order_number_positive check (order_number > 0),
  constraint orders_subtotal_nonneg check (subtotal >= 0),
  constraint orders_total_nonneg check (total >= 0),
  constraint orders_total_equals_subtotal check (total = subtotal),
  constraint orders_notes_length check (notes is null or char_length(notes) <= 250),
  constraint orders_session_length check (char_length(customer_session_id) >= 32),
  constraint orders_idempotency_length check (char_length(idempotency_key) >= 8),
  constraint orders_cafe_order_number_unique unique (cafe_id, order_number),
  constraint orders_cafe_idempotency_unique unique (cafe_id, idempotency_key),
  constraint orders_public_token_unique unique (public_token)
);

create index orders_cafe_id_idx on public.orders (cafe_id);
create index orders_cafe_status_created_idx on public.orders (cafe_id, status, created_at desc);
create index orders_table_id_idx on public.orders (table_id);
create index orders_customer_session_idx on public.orders (customer_session_id);
create index orders_created_at_idx on public.orders (created_at desc);

comment on table public.orders is
  'Module 11 customer orders. Prices snapshotted on items; total = subtotal (no tax/fees yet).';
comment on column public.orders.public_token is
  'Opaque guest tracking token for /order/{token}. Not a capability alone — paired with session.';
comment on column public.orders.idempotency_key is
  'Client-generated key; unique per cafe to prevent duplicate submissions.';

create trigger orders_set_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- order_items
-- ---------------------------------------------------------------------------

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  menu_item_id uuid references public.menu_items (id) on delete set null,
  item_name_snapshot text not null,
  item_price_snapshot numeric(10, 2) not null,
  quantity integer not null,
  line_total numeric(12, 2) not null,
  notes text,
  created_at timestamptz not null default now(),
  constraint order_items_name_length check (char_length(item_name_snapshot) between 1 and 120),
  constraint order_items_price_nonneg check (item_price_snapshot >= 0),
  constraint order_items_quantity_range check (quantity > 0 and quantity <= 99),
  constraint order_items_line_total_nonneg check (line_total >= 0),
  constraint order_items_notes_length check (notes is null or char_length(notes) <= 120)
);

create index order_items_order_id_idx on public.order_items (order_id);
create index order_items_menu_item_id_idx on public.order_items (menu_item_id);

comment on table public.order_items is
  'Line items with name/price snapshots at order creation time.';

-- ---------------------------------------------------------------------------
-- RLS — members only; anon has zero direct access
-- ---------------------------------------------------------------------------

alter table public.orders enable row level security;
alter table public.orders force row level security;
alter table public.order_items enable row level security;
alter table public.order_items force row level security;

revoke all on table public.orders from anon, public;
revoke all on table public.order_items from anon, public;

grant select, update on table public.orders to authenticated;
grant select on table public.order_items to authenticated;

create policy "orders_select_member"
on public.orders
for select
to authenticated
using (private.is_cafe_member(cafe_id));

create policy "orders_update_member"
on public.orders
for update
to authenticated
using (private.is_cafe_member(cafe_id))
with check (private.is_cafe_member(cafe_id));

create policy "order_items_select_member"
on public.order_items
for select
to authenticated
using (
  exists (
    select 1
    from public.orders o
    where o.id = order_id
      and private.is_cafe_member(o.cafe_id)
  )
);

-- ---------------------------------------------------------------------------
-- Status transition helper (staff)
-- ---------------------------------------------------------------------------

create or replace function public.transition_order_status(
  p_order_id uuid,
  p_next public.order_status
)
returns public.orders
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_order public.orders;
  v_role public.cafe_role;
begin
  select * into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'ORDER_NOT_FOUND';
  end if;

  v_role := private.current_user_cafe_role(v_order.cafe_id);
  if v_role is null then
    raise exception 'ORDER_FORBIDDEN';
  end if;

  if v_order.status = p_next then
    return v_order;
  end if;

  if not (
    (v_order.status = 'pending' and p_next in ('confirmed', 'rejected'))
    or (v_order.status = 'confirmed' and p_next = 'preparing')
    or (v_order.status = 'preparing' and p_next = 'ready')
    or (v_order.status = 'ready' and p_next = 'completed')
  ) then
    raise exception 'ORDER_INVALID_TRANSITION';
  end if;

  update public.orders
  set
    status = p_next,
    confirmed_at = case when p_next = 'confirmed' then now() else confirmed_at end,
    preparing_at = case when p_next = 'preparing' then now() else preparing_at end,
    ready_at = case when p_next = 'ready' then now() else ready_at end,
    completed_at = case when p_next = 'completed' then now() else completed_at end,
    rejected_at = case when p_next = 'rejected' then now() else rejected_at end,
    updated_at = now()
  where id = p_order_id
  returning * into v_order;

  return v_order;
end;
$$;

revoke all on function public.transition_order_status(uuid, public.order_status) from public, anon;
grant execute on function public.transition_order_status(uuid, public.order_status) to authenticated;

-- ---------------------------------------------------------------------------
-- Guest place order (atomic) — called from server with service role client
-- ---------------------------------------------------------------------------

create or replace function public.place_customer_order(
  p_cafe_slug text,
  p_table_token text,
  p_customer_session_id text,
  p_idempotency_key text,
  p_notes text,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cafe public.cafes%rowtype;
  v_table public.cafe_tables%rowtype;
  v_existing public.orders%rowtype;
  v_order public.orders%rowtype;
  v_order_number integer;
  v_subtotal numeric(12, 2) := 0;
  v_item jsonb;
  v_menu public.menu_items%rowtype;
  v_qty integer;
  v_line numeric(12, 2);
  v_notes text;
  v_items_out jsonb := '[]'::jsonb;
begin
  if p_customer_session_id is null or char_length(p_customer_session_id) < 32 then
    raise exception 'ORDER_BAD_SESSION';
  end if;
  if p_idempotency_key is null or char_length(p_idempotency_key) < 8 then
    raise exception 'ORDER_BAD_IDEMPOTENCY';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) < 1 then
    raise exception 'ORDER_EMPTY';
  end if;
  if jsonb_array_length(p_items) > 50 then
    raise exception 'ORDER_TOO_MANY_LINES';
  end if;

  v_notes := nullif(trim(coalesce(p_notes, '')), '');
  if v_notes is not null and char_length(v_notes) > 250 then
    raise exception 'ORDER_NOTES_TOO_LONG';
  end if;

  select * into v_cafe
  from public.cafes
  where slug = lower(trim(p_cafe_slug))
  for share;

  if not found or v_cafe.status <> 'active' then
    raise exception 'ORDER_CAFE_UNAVAILABLE';
  end if;

  select * into v_table
  from public.cafe_tables
  where cafe_id = v_cafe.id
    and public_token = trim(p_table_token)
  for share;

  if not found or v_table.status <> 'active' then
    raise exception 'ORDER_TABLE_UNAVAILABLE';
  end if;

  select * into v_existing
  from public.orders
  where cafe_id = v_cafe.id
    and idempotency_key = p_idempotency_key;

  if found then
    if v_existing.customer_session_id <> p_customer_session_id then
      raise exception 'ORDER_IDEMPOTENCY_CONFLICT';
    end if;
    return jsonb_build_object(
      'order_id', v_existing.id,
      'public_token', v_existing.public_token,
      'order_number', v_existing.order_number,
      'status', v_existing.status,
      'replayed', true
    );
  end if;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := (v_item ->> 'quantity')::integer;
    if v_qty is null or v_qty < 1 or v_qty > 99 then
      raise exception 'ORDER_BAD_QUANTITY';
    end if;

    select * into v_menu
    from public.menu_items
    where id = (v_item ->> 'menu_item_id')::uuid
      and cafe_id = v_cafe.id;

    if not found then
      raise exception 'ORDER_ITEM_INVALID';
    end if;
    if not v_menu.is_available then
      raise exception 'ORDER_ITEM_UNAVAILABLE';
    end if;
    if not exists (
      select 1
      from public.menu_categories cat
      where cat.id = v_menu.category_id
        and cat.cafe_id = v_cafe.id
        and cat.is_active
    ) then
      raise exception 'ORDER_ITEM_UNAVAILABLE';
    end if;

    v_line := round(v_menu.price * v_qty, 2);
    v_subtotal := v_subtotal + v_line;
    v_items_out := v_items_out || jsonb_build_array(
      jsonb_build_object(
        'menu_item_id', v_menu.id,
        'name', v_menu.name,
        'price', v_menu.price,
        'quantity', v_qty,
        'line_total', v_line
      )
    );
  end loop;

  insert into public.cafe_order_counters (cafe_id, last_number)
  values (v_cafe.id, 1000)
  on conflict (cafe_id) do nothing;

  update public.cafe_order_counters
  set last_number = last_number + 1
  where cafe_id = v_cafe.id
  returning last_number into v_order_number;

  insert into public.orders (
    cafe_id,
    table_id,
    order_number,
    status,
    customer_session_id,
    idempotency_key,
    subtotal,
    total,
    notes
  )
  values (
    v_cafe.id,
    v_table.id,
    v_order_number,
    'pending',
    p_customer_session_id,
    p_idempotency_key,
    v_subtotal,
    v_subtotal,
    v_notes
  )
  returning * into v_order;

  insert into public.order_items (
    order_id,
    menu_item_id,
    item_name_snapshot,
    item_price_snapshot,
    quantity,
    line_total
  )
  select
    v_order.id,
    (elem ->> 'menu_item_id')::uuid,
    elem ->> 'name',
    (elem ->> 'price')::numeric,
    (elem ->> 'quantity')::integer,
    (elem ->> 'line_total')::numeric
  from jsonb_array_elements(v_items_out) as elem;

  return jsonb_build_object(
    'order_id', v_order.id,
    'public_token', v_order.public_token,
    'order_number', v_order.order_number,
    'status', v_order.status,
    'replayed', false
  );
end;
$$;

revoke all on function public.place_customer_order(text, text, text, text, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.place_customer_order(text, text, text, text, text, jsonb)
  to service_role;

create or replace function public.get_customer_order(
  p_public_token text,
  p_customer_session_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_cafe_name text;
  v_table_code text;
  v_items jsonb;
begin
  if p_public_token is null or trim(p_public_token) = '' then
    return null;
  end if;
  if p_customer_session_id is null or char_length(p_customer_session_id) < 32 then
    return null;
  end if;

  select * into v_order
  from public.orders
  where public_token = trim(p_public_token)
    and customer_session_id = p_customer_session_id;

  if not found then
    return null;
  end if;

  select c.name, t.code
  into v_cafe_name, v_table_code
  from public.cafes c
  join public.cafe_tables t on t.id = v_order.table_id
  where c.id = v_order.cafe_id;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', oi.id,
      'name', oi.item_name_snapshot,
      'price', oi.item_price_snapshot,
      'quantity', oi.quantity,
      'line_total', oi.line_total
    ) order by oi.created_at
  ), '[]'::jsonb)
  into v_items
  from public.order_items oi
  where oi.order_id = v_order.id;

  return jsonb_build_object(
    'public_token', v_order.public_token,
    'order_number', v_order.order_number,
    'status', v_order.status,
    'subtotal', v_order.subtotal,
    'total', v_order.total,
    'notes', v_order.notes,
    'created_at', v_order.created_at,
    'cafe_name', v_cafe_name,
    'table_code', v_table_code,
    'currency', (select currency from public.cafes where id = v_order.cafe_id),
    'items', v_items
  );
end;
$$;

revoke all on function public.get_customer_order(text, text) from public, anon, authenticated;
grant execute on function public.get_customer_order(text, text) to service_role;

do $$
begin
  alter publication supabase_realtime add table public.orders;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;
