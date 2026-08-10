-- Module 3: Cafe memberships + RBAC (+ invite architecture)
-- Roles: owner | manager | staff
-- SECURITY DEFINER helpers live in `private` and always filter by auth.uid().

create schema if not exists private;

create type public.cafe_role as enum ('owner', 'manager', 'staff');

create type public.cafe_invite_status as enum ('pending', 'accepted', 'revoked');

-- ---------------------------------------------------------------------------
-- memberships
-- ---------------------------------------------------------------------------

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  cafe_id uuid not null references public.cafes (id) on delete cascade,
  role public.cafe_role not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint memberships_user_cafe_unique unique (user_id, cafe_id)
);

create index memberships_cafe_id_idx on public.memberships (cafe_id);
create index memberships_user_id_idx on public.memberships (user_id);
create index memberships_cafe_role_idx on public.memberships (cafe_id, role);

comment on table public.memberships is 'User ↔ cafe membership with RBAC role.';

create trigger memberships_set_updated_at
before update on public.memberships
for each row
execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- cafe_invitations (invite-by-email architecture; email delivery later)
-- ---------------------------------------------------------------------------

create table public.cafe_invitations (
  id uuid primary key default gen_random_uuid(),
  cafe_id uuid not null references public.cafes (id) on delete cascade,
  email text not null,
  role public.cafe_role not null,
  invited_by uuid not null references auth.users (id) on delete cascade,
  status public.cafe_invite_status not null default 'pending',
  token uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cafe_invitations_role_not_owner check (role in ('manager', 'staff')),
  constraint cafe_invitations_email_format check (position('@' in email) > 1),
  constraint cafe_invitations_token_unique unique (token)
);

create unique index cafe_invitations_pending_email_cafe_unique
  on public.cafe_invitations (cafe_id, lower(email))
  where status = 'pending';

create index cafe_invitations_cafe_id_idx on public.cafe_invitations (cafe_id);
create index cafe_invitations_email_idx on public.cafe_invitations (lower(email));

comment on table public.cafe_invitations is
  'Pending cafe invites by email. Acceptance creates a membership.';

create trigger cafe_invitations_set_updated_at
before update on public.cafe_invitations
for each row
execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Helpers (security definer, locked down)
-- ---------------------------------------------------------------------------

create or replace function private.current_user_cafe_role(p_cafe_id uuid)
returns public.cafe_role
language sql
stable
security definer
set search_path = public
as $$
  select m.role
  from public.memberships m
  where m.cafe_id = p_cafe_id
    and m.user_id = auth.uid()
  limit 1;
$$;

revoke all on function private.current_user_cafe_role(uuid) from public;
grant execute on function private.current_user_cafe_role(uuid) to authenticated;

create or replace function private.is_cafe_member(p_cafe_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.memberships m
    where m.cafe_id = p_cafe_id
      and m.user_id = auth.uid()
  );
$$;

revoke all on function private.is_cafe_member(uuid) from public;
grant execute on function private.is_cafe_member(uuid) to authenticated;

create or replace function public.current_user_cafe_role(p_cafe_id uuid)
returns public.cafe_role
language sql
stable
security invoker
set search_path = public
as $$
  select private.current_user_cafe_role(p_cafe_id);
$$;

revoke all on function public.current_user_cafe_role(uuid) from public;
grant execute on function public.current_user_cafe_role(uuid) to authenticated;

-- Auto-create owner membership when a cafe is created.
create or replace function private.handle_cafe_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.memberships (user_id, cafe_id, role)
  values (new.owner_id, new.id, 'owner')
  on conflict (user_id, cafe_id) do nothing;
  return new;
end;
$$;

revoke all on function private.handle_cafe_created() from public;

create trigger cafes_create_owner_membership
after insert on public.cafes
for each row
execute function private.handle_cafe_created();

-- Backfill owner memberships for existing cafes.
insert into public.memberships (user_id, cafe_id, role)
select c.owner_id, c.id, 'owner'::public.cafe_role
from public.cafes c
on conflict (user_id, cafe_id) do nothing;

-- ---------------------------------------------------------------------------
-- RLS: memberships
-- ---------------------------------------------------------------------------

alter table public.memberships enable row level security;

revoke all on table public.memberships from authenticated;
grant select, insert, update, delete on table public.memberships to authenticated;

-- Read: own row, or any membership in a cafe you belong to (team list).
create policy "memberships_select_tenant"
on public.memberships
for select
to authenticated
using (
  user_id = (select auth.uid())
  or private.is_cafe_member(cafe_id)
);

-- Insert: owner can add manager/staff; manager can add staff; self-owner only via cafe create path is handled by trigger (definer).
create policy "memberships_insert_managers"
on public.memberships
for insert
to authenticated
with check (
  (
    private.current_user_cafe_role(cafe_id) = 'owner'
    and role in ('manager', 'staff')
  )
  or (
    private.current_user_cafe_role(cafe_id) = 'manager'
    and role = 'staff'
  )
);

-- Invite acceptance: invitee may create their own non-owner membership.
create policy "memberships_insert_from_invite"
on public.memberships
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and role in ('manager', 'staff')
  and exists (
    select 1
    from public.cafe_invitations i
    where i.cafe_id = cafe_id
      and i.status = 'pending'
      and i.role = role
      and lower(i.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
);

-- Update roles: owner can set manager/staff (not owner); manager can set staff only; never change owner rows here.
create policy "memberships_update_roles"
on public.memberships
for update
to authenticated
using (
  role <> 'owner'
  and (
    private.current_user_cafe_role(cafe_id) = 'owner'
    or (
      private.current_user_cafe_role(cafe_id) = 'manager'
      and role = 'staff'
    )
  )
)
with check (
  role in ('manager', 'staff')
  and (
    private.current_user_cafe_role(cafe_id) = 'owner'
    or (
      private.current_user_cafe_role(cafe_id) = 'manager'
      and role = 'staff'
    )
  )
);

-- Delete: owner removes manager/staff; manager removes staff; non-owners may leave (delete self).
create policy "memberships_delete"
on public.memberships
for delete
to authenticated
using (
  (
    user_id = (select auth.uid())
    and role <> 'owner'
  )
  or (
    role <> 'owner'
    and private.current_user_cafe_role(cafe_id) = 'owner'
  )
  or (
    role = 'staff'
    and private.current_user_cafe_role(cafe_id) = 'manager'
  )
);

-- ---------------------------------------------------------------------------
-- RLS: cafe_invitations
-- ---------------------------------------------------------------------------

alter table public.cafe_invitations enable row level security;

revoke all on table public.cafe_invitations from authenticated;
grant select, insert, update, delete on table public.cafe_invitations to authenticated;

create policy "invitations_select"
on public.cafe_invitations
for select
to authenticated
using (
  private.current_user_cafe_role(cafe_id) in ('owner', 'manager')
  or lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
);

create policy "invitations_insert"
on public.cafe_invitations
for insert
to authenticated
with check (
  invited_by = (select auth.uid())
  and role in ('manager', 'staff')
  and (
    private.current_user_cafe_role(cafe_id) = 'owner'
    or (
      private.current_user_cafe_role(cafe_id) = 'manager'
      and role = 'staff'
    )
  )
);

create policy "invitations_update"
on public.cafe_invitations
for update
to authenticated
using (
  private.current_user_cafe_role(cafe_id) in ('owner', 'manager')
  or lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
)
with check (
  private.current_user_cafe_role(cafe_id) in ('owner', 'manager')
  or lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
);

create policy "invitations_delete"
on public.cafe_invitations
for delete
to authenticated
using (private.current_user_cafe_role(cafe_id) in ('owner', 'manager'));

-- ---------------------------------------------------------------------------
-- Update cafes RLS for membership-aware access
-- ---------------------------------------------------------------------------

drop policy if exists "cafes_select_own" on public.cafes;
drop policy if exists "cafes_update_own" on public.cafes;
drop policy if exists "cafes_delete_own" on public.cafes;
-- keep insert policy (creator must be owner_id = auth.uid())

create policy "cafes_select_member"
on public.cafes
for select
to authenticated
using (private.is_cafe_member(id));

create policy "cafes_update_owner_manager"
on public.cafes
for update
to authenticated
using (private.current_user_cafe_role(id) in ('owner', 'manager'))
with check (private.current_user_cafe_role(id) in ('owner', 'manager'));

-- Prevent managers (and anyone) from changing owner_id.
create or replace function private.prevent_cafe_owner_reassign()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.owner_id is distinct from old.owner_id then
    raise exception 'owner_id cannot be changed';
  end if;
  return new;
end;
$$;

create trigger cafes_prevent_owner_reassign
before update on public.cafes
for each row
execute function private.prevent_cafe_owner_reassign();

create policy "cafes_delete_owner"
on public.cafes
for delete
to authenticated
using (private.current_user_cafe_role(id) = 'owner');
