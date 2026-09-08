-- Module 12: Order status history + optional rejection note for operations audit.

create table public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  cafe_id uuid not null references public.cafes (id) on delete cascade,
  old_status public.order_status,
  new_status public.order_status not null,
  changed_by uuid references auth.users (id) on delete set null,
  note text,
  created_at timestamptz not null default now(),
  constraint order_status_history_note_length check (
    note is null or char_length(note) between 1 and 250
  )
);

create index order_status_history_order_created_idx
  on public.order_status_history (order_id, created_at asc);

create index order_status_history_cafe_created_idx
  on public.order_status_history (cafe_id, created_at desc);

comment on table public.order_status_history is
  'Module 12 audit trail for order status changes. Append-only for staff/guests via triggers.';

alter table public.order_status_history enable row level security;
alter table public.order_status_history force row level security;

revoke all on table public.order_status_history from anon, public;
grant select on table public.order_status_history to authenticated;

create policy "order_status_history_select_member"
on public.order_status_history
for select
to authenticated
using (private.is_cafe_member(cafe_id));

-- Optional staff note when rejecting (cancel) an order
alter table public.orders
  add column if not exists rejection_reason text;

alter table public.orders
  drop constraint if exists orders_rejection_reason_length;

alter table public.orders
  add constraint orders_rejection_reason_length check (
    rejection_reason is null or char_length(rejection_reason) between 1 and 250
  );

-- Append-only history on insert (placed) and status updates
create or replace function private.record_order_status_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.order_status_history (
      order_id, cafe_id, old_status, new_status, changed_by, note
    ) values (
      new.id, new.cafe_id, null, new.status, auth.uid(), null
    );
    return new;
  end if;

  if tg_op = 'UPDATE' and old.status is distinct from new.status then
    insert into public.order_status_history (
      order_id, cafe_id, old_status, new_status, changed_by, note
    ) values (
      new.id,
      new.cafe_id,
      old.status,
      new.status,
      auth.uid(),
      case
        when new.status = 'rejected' then new.rejection_reason
        else null
      end
    );
  end if;

  return new;
end;
$$;

revoke all on function private.record_order_status_history() from public, anon, authenticated;

-- Replace Module 11 2-arg transition with 3-arg (optional note) version.
drop function if exists public.transition_order_status(uuid, public.order_status);

drop trigger if exists orders_record_status_history_insert on public.orders;
create trigger orders_record_status_history_insert
after insert on public.orders
for each row execute function private.record_order_status_history();

drop trigger if exists orders_record_status_history_update on public.orders;
create trigger orders_record_status_history_update
after update of status on public.orders
for each row execute function private.record_order_status_history();

-- Extend transition RPC with optional note (rejection reason). Keep 2-arg wrapper.
create or replace function public.transition_order_status(
  p_order_id uuid,
  p_next public.order_status,
  p_note text default null
)
returns public.orders
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_order public.orders;
  v_role public.cafe_role;
  v_note text;
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

  v_note := nullif(trim(both from coalesce(p_note, '')), '');
  if v_note is not null and char_length(v_note) > 250 then
    raise exception 'ORDER_BAD_NOTE';
  end if;

  if p_next = 'rejected' and v_note is null then
    -- Reason encouraged but not strictly required for ops speed
    v_note := null;
  end if;

  if p_next is distinct from 'rejected' and v_note is not null then
    -- Ignore notes on non-reject transitions
    v_note := null;
  end if;

  update public.orders
  set
    status = p_next,
    rejection_reason = case
      when p_next = 'rejected' then v_note
      else rejection_reason
    end,
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

revoke all on function public.transition_order_status(uuid, public.order_status, text)
  from public, anon;
grant execute on function public.transition_order_status(uuid, public.order_status, text)
  to authenticated;

comment on function public.transition_order_status(uuid, public.order_status, text) is
  'Module 11/12 controlled order status transitions. Optional note used for rejection reason.';

-- Seed history for orders that already exist (Module 11) so timelines aren't empty.
insert into public.order_status_history (
  order_id, cafe_id, old_status, new_status, changed_by, note, created_at
)
select
  o.id,
  o.cafe_id,
  null,
  o.status,
  null,
  null,
  o.created_at
from public.orders o
where not exists (
  select 1 from public.order_status_history h where h.order_id = o.id
);
