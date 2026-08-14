-- Module 7: Cafe table sections + cafe tables (floor / QR foundation).
-- Tenant-scoped. Operational status only (active/inactive).
-- Occupancy / booking / QR sessions belong to future modules.

create type public.cafe_table_status as enum ('active', 'inactive');

comment on type public.cafe_table_status is
  'Operational table flag. inactive hides a table from ops without deleting history. '
  'Booking/occupancy states must NOT extend this enum — use separate session/order tables.';

-- ---------------------------------------------------------------------------
-- cafe_table_sections
-- ---------------------------------------------------------------------------

create table public.cafe_table_sections (
  id uuid primary key default gen_random_uuid(),
  cafe_id uuid not null references public.cafes (id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cafe_table_sections_name_length
    check (char_length(trim(name)) between 1 and 64)
);

create unique index cafe_table_sections_cafe_name_unique
  on public.cafe_table_sections (cafe_id, lower(trim(name)));

create index cafe_table_sections_cafe_id_idx
  on public.cafe_table_sections (cafe_id);

comment on table public.cafe_table_sections is
  'Optional floor/area grouping (Indoor, Terrace, etc.) within a cafe.';

create trigger cafe_table_sections_set_updated_at
before update on public.cafe_table_sections
for each row
execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- cafe_tables
-- ---------------------------------------------------------------------------

create table public.cafe_tables (
  id uuid primary key default gen_random_uuid(),
  cafe_id uuid not null references public.cafes (id) on delete cascade,
  code text not null,
  capacity integer not null,
  status public.cafe_table_status not null default 'active',
  section_id uuid references public.cafe_table_sections (id) on delete set null,
  public_token text not null default replace(gen_random_uuid()::text, '-', ''),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cafe_tables_code_length
    check (char_length(trim(code)) between 1 and 32),
  constraint cafe_tables_capacity_range
    check (capacity between 1 and 99)
);

create unique index cafe_tables_cafe_code_unique
  on public.cafe_tables (cafe_id, lower(trim(code)));

create unique index cafe_tables_public_token_unique
  on public.cafe_tables (public_token);

create index cafe_tables_cafe_id_idx on public.cafe_tables (cafe_id);
create index cafe_tables_cafe_status_idx on public.cafe_tables (cafe_id, status);
create index cafe_tables_section_id_idx on public.cafe_tables (section_id);

comment on table public.cafe_tables is
  'Physical cafe tables. Identifier (code) is unique per cafe, not globally. '
  'public_token is a stable non-UUID public id for future QR / guest deep links.';
comment on column public.cafe_tables.code is
  'Human-readable table identifier within a cafe (e.g. T01, VIP-01).';
comment on column public.cafe_tables.public_token is
  'Opaque public identifier for future QR ordering. Do not treat as a secret.';
comment on column public.cafe_tables.sort_order is
  'Display order; reserved for future floor-plan / list ordering.';

create trigger cafe_tables_set_updated_at
before update on public.cafe_tables
for each row
execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Immutable cafe_id + same-cafe section enforcement
-- ---------------------------------------------------------------------------

create or replace function private.prevent_cafe_table_section_rekey()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.cafe_id is distinct from old.cafe_id then
    raise exception 'cafe_table_sections.cafe_id cannot be changed';
  end if;
  return new;
end;
$$;

revoke all on function private.prevent_cafe_table_section_rekey() from public;

create trigger cafe_table_sections_prevent_rekey
before update on public.cafe_table_sections
for each row
execute function private.prevent_cafe_table_section_rekey();

create or replace function private.prevent_cafe_table_rekey()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.cafe_id is distinct from old.cafe_id then
    raise exception 'cafe_tables.cafe_id cannot be changed';
  end if;
  if new.public_token is distinct from old.public_token then
    raise exception 'cafe_tables.public_token cannot be changed';
  end if;
  return new;
end;
$$;

revoke all on function private.prevent_cafe_table_rekey() from public;

create trigger cafe_tables_prevent_rekey
before update on public.cafe_tables
for each row
execute function private.prevent_cafe_table_rekey();

create or replace function private.enforce_table_section_same_cafe()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.section_id is null then
    return new;
  end if;

  if not exists (
    select 1
    from public.cafe_table_sections s
    where s.id = new.section_id
      and s.cafe_id = new.cafe_id
  ) then
    raise exception 'section must belong to the same cafe as the table';
  end if;

  return new;
end;
$$;

revoke all on function private.enforce_table_section_same_cafe() from public;

create trigger cafe_tables_enforce_section_cafe
before insert or update of section_id, cafe_id on public.cafe_tables
for each row
execute function private.enforce_table_section_same_cafe();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.cafe_table_sections enable row level security;
alter table public.cafe_table_sections force row level security;

alter table public.cafe_tables enable row level security;
alter table public.cafe_tables force row level security;

revoke all on table public.cafe_table_sections from anon, public;
revoke all on table public.cafe_tables from anon, public;

grant select, insert, update, delete on table public.cafe_table_sections to authenticated;
grant select, insert, update, delete on table public.cafe_tables to authenticated;

-- Sections: members read; owner/manager write
create policy "cafe_table_sections_select_member"
on public.cafe_table_sections
for select
to authenticated
using (private.is_cafe_member(cafe_id));

create policy "cafe_table_sections_insert_managers"
on public.cafe_table_sections
for insert
to authenticated
with check (
  private.current_user_cafe_role(cafe_id) in ('owner', 'manager')
);

create policy "cafe_table_sections_update_managers"
on public.cafe_table_sections
for update
to authenticated
using (
  private.current_user_cafe_role(cafe_id) in ('owner', 'manager')
)
with check (
  private.current_user_cafe_role(cafe_id) in ('owner', 'manager')
);

create policy "cafe_table_sections_delete_managers"
on public.cafe_table_sections
for delete
to authenticated
using (
  private.current_user_cafe_role(cafe_id) in ('owner', 'manager')
);

-- Tables: members read; owner/manager write
create policy "cafe_tables_select_member"
on public.cafe_tables
for select
to authenticated
using (private.is_cafe_member(cafe_id));

create policy "cafe_tables_insert_managers"
on public.cafe_tables
for insert
to authenticated
with check (
  private.current_user_cafe_role(cafe_id) in ('owner', 'manager')
);

create policy "cafe_tables_update_managers"
on public.cafe_tables
for update
to authenticated
using (
  private.current_user_cafe_role(cafe_id) in ('owner', 'manager')
)
with check (
  private.current_user_cafe_role(cafe_id) in ('owner', 'manager')
);

create policy "cafe_tables_delete_managers"
on public.cafe_tables
for delete
to authenticated
using (
  private.current_user_cafe_role(cafe_id) in ('owner', 'manager')
);
