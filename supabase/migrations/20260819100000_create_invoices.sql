-- Module 14: Cafe invoices from completed orders (no payments / tax engine).

create type public.invoice_status as enum ('issued');

create table public.cafe_invoice_counters (
  cafe_id uuid primary key references public.cafes (id) on delete cascade,
  last_number integer not null default 0
    constraint cafe_invoice_counters_last_number_nonneg check (last_number >= 0)
);

alter table public.cafe_invoice_counters enable row level security;
alter table public.cafe_invoice_counters force row level security;
revoke all on table public.cafe_invoice_counters from anon, public, authenticated;

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  cafe_id uuid not null references public.cafes (id) on delete restrict,
  order_id uuid not null references public.orders (id) on delete restrict,
  invoice_number text not null,
  status public.invoice_status not null default 'issued',
  customer_name text,
  customer_phone text,
  table_code text,
  order_number integer not null,
  cafe_name_snapshot text not null,
  cafe_phone_snapshot text,
  cafe_email_snapshot text,
  cafe_address_snapshot text,
  cafe_logo_url_snapshot text,
  currency text not null default 'INR',
  subtotal numeric(12, 2) not null,
  tax_amount numeric(12, 2) not null default 0,
  discount_amount numeric(12, 2) not null default 0,
  total_amount numeric(12, 2) not null,
  notes_snapshot text,
  issued_by uuid references auth.users (id) on delete set null,
  issued_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint invoices_order_unique unique (order_id),
  constraint invoices_cafe_number_unique unique (cafe_id, invoice_number),
  constraint invoices_number_format check (invoice_number ~ '^INV-[0-9]{4}-[0-9]{6}$'),
  constraint invoices_order_number_positive check (order_number > 0),
  constraint invoices_subtotal_nonneg check (subtotal >= 0),
  constraint invoices_tax_nonneg check (tax_amount >= 0),
  constraint invoices_discount_nonneg check (discount_amount >= 0),
  constraint invoices_total_nonneg check (total_amount >= 0),
  constraint invoices_total_matches check (total_amount = subtotal + tax_amount - discount_amount),
  constraint invoices_customer_name_length check (
    customer_name is null or char_length(customer_name) between 1 and 120
  ),
  constraint invoices_customer_phone_length check (
    customer_phone is null or char_length(customer_phone) between 1 and 20
  ),
  constraint invoices_notes_length check (
    notes_snapshot is null or char_length(notes_snapshot) <= 250
  )
);

create index invoices_cafe_issued_idx on public.invoices (cafe_id, issued_at desc);
create index invoices_cafe_number_idx on public.invoices (cafe_id, invoice_number);

comment on table public.invoices is
  'Module 14 cafe bills. One invoice per completed order. Totals and cafe letterhead are snapshotted.';

create trigger invoices_set_updated_at
before update on public.invoices
for each row execute function public.set_updated_at();

create table public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices (id) on delete cascade,
  menu_item_id uuid references public.menu_items (id) on delete set null,
  item_name_snapshot text not null,
  unit_price_snapshot numeric(10, 2) not null,
  quantity integer not null,
  line_total numeric(12, 2) not null,
  created_at timestamptz not null default now(),
  constraint invoice_items_name_length check (char_length(item_name_snapshot) between 1 and 120),
  constraint invoice_items_qty_range check (quantity between 1 and 99),
  constraint invoice_items_price_nonneg check (unit_price_snapshot >= 0),
  constraint invoice_items_line_nonneg check (line_total >= 0)
);

create index invoice_items_invoice_id_idx on public.invoice_items (invoice_id);

alter table public.invoices enable row level security;
alter table public.invoices force row level security;
alter table public.invoice_items enable row level security;
alter table public.invoice_items force row level security;

revoke all on table public.invoices from anon, public;
revoke all on table public.invoice_items from anon, public;
grant select on table public.invoices to authenticated;
grant select on table public.invoice_items to authenticated;

create policy "invoices_select_member"
on public.invoices
for select
to authenticated
using (private.is_cafe_member(cafe_id));

create policy "invoice_items_select_member"
on public.invoice_items
for select
to authenticated
using (
  exists (
    select 1
    from public.invoices i
    where i.id = invoice_id
      and private.is_cafe_member(i.cafe_id)
  )
);

-- ---------------------------------------------------------------------------
-- Shared issuer (SECURITY DEFINER — counter table is not granted to members)
-- ---------------------------------------------------------------------------

create or replace function private.create_invoice_from_completed_order(
  p_order_id uuid,
  p_issued_by uuid
)
returns public.invoices
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_cafe public.cafes%rowtype;
  v_table_code text;
  v_next integer;
  v_year text;
  v_invoice public.invoices%rowtype;
  v_address text;
begin
  select * into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'INVOICE_ORDER_NOT_FOUND';
  end if;

  if v_order.status is distinct from 'completed' then
    raise exception 'INVOICE_ORDER_NOT_READY';
  end if;

  select * into v_invoice
  from public.invoices
  where order_id = v_order.id;

  if found then
    return v_invoice;
  end if;

  select * into v_cafe
  from public.cafes
  where id = v_order.cafe_id;

  select code into v_table_code
  from public.cafe_tables
  where id = v_order.table_id;

  insert into public.cafe_invoice_counters (cafe_id, last_number)
  values (v_order.cafe_id, 0)
  on conflict (cafe_id) do nothing;

  update public.cafe_invoice_counters
  set last_number = last_number + 1
  where cafe_id = v_order.cafe_id
  returning last_number into v_next;

  v_year := to_char(timezone('utc', now()), 'YYYY');

  v_address := nullif(
    trim(both from concat_ws(
      ', ',
      nullif(trim(both from coalesce(v_cafe.address_line1, '')), ''),
      nullif(trim(both from coalesce(v_cafe.address_line2, '')), ''),
      nullif(trim(both from coalesce(v_cafe.city, '')), ''),
      nullif(trim(both from coalesce(v_cafe.state, '')), ''),
      nullif(trim(both from coalesce(v_cafe.postal_code, '')), '')
    )),
    ''
  );

  begin
    insert into public.invoices (
      cafe_id,
      order_id,
      invoice_number,
      status,
      table_code,
      order_number,
      cafe_name_snapshot,
      cafe_phone_snapshot,
      cafe_email_snapshot,
      cafe_address_snapshot,
      cafe_logo_url_snapshot,
      currency,
      subtotal,
      tax_amount,
      discount_amount,
      total_amount,
      notes_snapshot,
      issued_by
    ) values (
      v_order.cafe_id,
      v_order.id,
      'INV-' || v_year || '-' || lpad(v_next::text, 6, '0'),
      'issued',
      v_table_code,
      v_order.order_number,
      v_cafe.name,
      nullif(trim(both from coalesce(v_cafe.phone, '')), ''),
      nullif(trim(both from coalesce(v_cafe.email, '')), ''),
      v_address,
      v_cafe.logo_url,
      coalesce(v_cafe.currency, 'INR'),
      v_order.subtotal,
      0,
      0,
      v_order.total,
      v_order.notes,
      p_issued_by
    )
    returning * into v_invoice;
  exception
    when unique_violation then
      select * into v_invoice
      from public.invoices
      where order_id = v_order.id;
      if not found then
        raise;
      end if;
      return v_invoice;
  end;

  insert into public.invoice_items (
    invoice_id,
    menu_item_id,
    item_name_snapshot,
    unit_price_snapshot,
    quantity,
    line_total
  )
  select
    v_invoice.id,
    oi.menu_item_id,
    oi.item_name_snapshot,
    oi.item_price_snapshot,
    oi.quantity,
    oi.line_total
  from public.order_items oi
  where oi.order_id = v_order.id
  order by oi.created_at;

  return v_invoice;
end;
$$;

revoke all on function private.create_invoice_from_completed_order(uuid, uuid)
  from public, anon, authenticated;

create or replace function public.issue_invoice_for_order(p_order_id uuid)
returns public.invoices
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_role public.cafe_role;
begin
  if auth.uid() is null then
    raise exception 'INVOICE_FORBIDDEN';
  end if;

  select * into v_order
  from public.orders
  where id = p_order_id;

  if not found then
    raise exception 'INVOICE_ORDER_NOT_FOUND';
  end if;

  v_role := private.current_user_cafe_role(v_order.cafe_id);
  if v_role is null then
    raise exception 'INVOICE_FORBIDDEN';
  end if;

  return private.create_invoice_from_completed_order(p_order_id, auth.uid());
end;
$$;

revoke all on function public.issue_invoice_for_order(uuid) from public, anon;
grant execute on function public.issue_invoice_for_order(uuid) to authenticated;

create or replace function public.issue_guest_invoice(
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
  v_invoice public.invoices%rowtype;
  v_existed boolean := false;
begin
  if p_public_token is null or trim(p_public_token) = '' then
    raise exception 'INVOICE_FORBIDDEN';
  end if;
  if p_customer_session_id is null or char_length(p_customer_session_id) < 32 then
    raise exception 'INVOICE_FORBIDDEN';
  end if;

  select * into v_order
  from public.orders
  where public_token = trim(p_public_token)
    and customer_session_id = p_customer_session_id;

  if not found then
    raise exception 'INVOICE_ORDER_NOT_FOUND';
  end if;

  select * into v_invoice
  from public.invoices
  where order_id = v_order.id;

  if found then
    v_existed := true;
  else
    v_invoice := private.create_invoice_from_completed_order(v_order.id, null);
  end if;

  return jsonb_build_object(
    'id', v_invoice.id,
    'invoice_number', v_invoice.invoice_number,
    'already_existed', v_existed
  );
end;
$$;

revoke all on function public.issue_guest_invoice(text, text)
  from public, anon, authenticated;
grant execute on function public.issue_guest_invoice(text, text) to service_role;

create or replace function public.get_customer_invoice(
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
  v_invoice public.invoices%rowtype;
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

  select * into v_invoice
  from public.invoices
  where order_id = v_order.id;

  if not found then
    return null;
  end if;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', ii.id,
      'name', ii.item_name_snapshot,
      'unit_price', ii.unit_price_snapshot,
      'quantity', ii.quantity,
      'line_total', ii.line_total
    ) order by ii.created_at
  ), '[]'::jsonb)
  into v_items
  from public.invoice_items ii
  where ii.invoice_id = v_invoice.id;

  return jsonb_build_object(
    'id', v_invoice.id,
    'invoice_number', v_invoice.invoice_number,
    'status', v_invoice.status,
    'order_number', v_invoice.order_number,
    'table_code', v_invoice.table_code,
    'cafe_name', v_invoice.cafe_name_snapshot,
    'cafe_phone', v_invoice.cafe_phone_snapshot,
    'cafe_email', v_invoice.cafe_email_snapshot,
    'cafe_address', v_invoice.cafe_address_snapshot,
    'cafe_logo_url', v_invoice.cafe_logo_url_snapshot,
    'currency', v_invoice.currency,
    'subtotal', v_invoice.subtotal,
    'tax_amount', v_invoice.tax_amount,
    'discount_amount', v_invoice.discount_amount,
    'total_amount', v_invoice.total_amount,
    'notes', v_invoice.notes_snapshot,
    'issued_at', v_invoice.issued_at,
    'items', v_items
  );
end;
$$;

revoke all on function public.get_customer_invoice(text, text)
  from public, anon, authenticated;
grant execute on function public.get_customer_invoice(text, text) to service_role;
