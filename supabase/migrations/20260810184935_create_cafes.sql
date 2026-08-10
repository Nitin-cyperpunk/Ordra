-- Cafe tenant root (Module 2).
-- Owner is the authenticated user who creates the cafe.
-- Memberships / RBAC arrive in later modules.

create extension if not exists "pgcrypto";

create table public.cafes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  owner_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cafes_name_length check (char_length(trim(name)) between 2 and 100),
  constraint cafes_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint cafes_slug_length check (char_length(slug) between 2 and 60)
);

create unique index cafes_slug_unique on public.cafes (slug);
create index cafes_owner_id_idx on public.cafes (owner_id);

comment on table public.cafes is 'Tenant root for Ordra cafes. owner_id is the creating user.';

-- Keep updated_at current (SECURITY INVOKER by default).
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger cafes_set_updated_at
before update on public.cafes
for each row
execute function public.set_updated_at();

alter table public.cafes enable row level security;

-- Explicit Data API grants (cloud no longer auto-exposes new tables).
grant select, insert, update, delete on table public.cafes to authenticated;

-- SELECT: owners only
create policy "cafes_select_own"
on public.cafes
for select
to authenticated
using ((select auth.uid()) = owner_id);

-- INSERT: must create as self
create policy "cafes_insert_own"
on public.cafes
for insert
to authenticated
with check ((select auth.uid()) = owner_id);

-- UPDATE: must already own, and cannot reassign ownership
create policy "cafes_update_own"
on public.cafes
for update
to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

-- DELETE: owners only (blocks cross-user deletes)
create policy "cafes_delete_own"
on public.cafes
for delete
to authenticated
using ((select auth.uid()) = owner_id);
