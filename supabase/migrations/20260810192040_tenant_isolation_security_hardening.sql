-- Module 4: Tenant isolation & security hardening
-- Defense-in-depth grants, immutable tenant keys, tightened invite updates.

-- ---------------------------------------------------------------------------
-- 1) Revoke Data API surface from anon / PUBLIC (RLS alone is not enough grants)
-- ---------------------------------------------------------------------------

revoke all on table public.cafes from anon, public;
revoke all on table public.memberships from anon, public;
revoke all on table public.cafe_invitations from anon, public;

grant select, insert, update, delete on table public.cafes to authenticated;
grant select, insert, update, delete on table public.memberships to authenticated;
grant select, insert, update, delete on table public.cafe_invitations to authenticated;

-- Force RLS even for table owners (service_role / bypassrls still bypasses).
alter table public.cafes force row level security;
alter table public.memberships force row level security;
alter table public.cafe_invitations force row level security;

-- ---------------------------------------------------------------------------
-- 2) Lock down callable functions
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.set_updated_at() from public;
revoke all on function public.set_updated_at() from anon, authenticated;

revoke all on function public.current_user_cafe_role(uuid) from public;
revoke all on function public.current_user_cafe_role(uuid) from anon;
grant execute on function public.current_user_cafe_role(uuid) to authenticated;

-- Event-trigger helper must not be RPC-callable.
revoke all on function public.rls_auto_enable() from public;
revoke all on function public.rls_auto_enable() from anon, authenticated;

revoke all on function private.prevent_cafe_owner_reassign() from public;
revoke all on function private.prevent_cafe_owner_reassign() from anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3) Immutable membership keys (user_id / cafe_id)
-- ---------------------------------------------------------------------------

create or replace function private.prevent_membership_rekey()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.user_id is distinct from old.user_id
     or new.cafe_id is distinct from old.cafe_id then
    raise exception 'membership user_id and cafe_id cannot be changed';
  end if;
  return new;
end;
$$;

revoke all on function private.prevent_membership_rekey() from public;

drop trigger if exists memberships_prevent_rekey on public.memberships;
create trigger memberships_prevent_rekey
before update on public.memberships
for each row
execute function private.prevent_membership_rekey();

-- ---------------------------------------------------------------------------
-- 4) Harden cafe_invitations updates (close invitee / manager privilege gaps)
-- ---------------------------------------------------------------------------

drop policy if exists "invitations_update" on public.cafe_invitations;

-- Owners/managers may revoke or edit invites they manage; managers staff-only.
create policy "invitations_update_managers"
on public.cafe_invitations
for update
to authenticated
using (
  private.current_user_cafe_role(cafe_id) = 'owner'
  or (
    private.current_user_cafe_role(cafe_id) = 'manager'
    and role = 'staff'
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

-- Invitee may only accept their own pending invite (status → accepted).
create policy "invitations_accept_invitee"
on public.cafe_invitations
for update
to authenticated
using (
  status = 'pending'
  and lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
)
with check (
  status = 'accepted'
  and role in ('manager', 'staff')
  and lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
);

create or replace function private.guard_invitation_update()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  actor_role public.cafe_role;
begin
  -- Tenant key + invite identity are immutable.
  if new.cafe_id is distinct from old.cafe_id
     or new.token is distinct from old.token
     or new.invited_by is distinct from old.invited_by
     or lower(new.email) is distinct from lower(old.email) then
    raise exception 'invitation cafe_id, email, token, and invited_by cannot be changed';
  end if;

  actor_role := private.current_user_cafe_role(old.cafe_id);

  if actor_role is null then
    -- Invitee path: only pending → accepted, role unchanged.
    if not (
      old.status = 'pending'
      and new.status = 'accepted'
      and new.role = old.role
      and lower(old.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    ) then
      raise exception 'invitees may only accept their own pending invitation';
    end if;
    return new;
  end if;

  if actor_role = 'manager' and (old.role <> 'staff' or new.role <> 'staff') then
    raise exception 'managers may only manage staff invitations';
  end if;

  if actor_role = 'staff' then
    raise exception 'staff cannot update invitations';
  end if;

  return new;
end;
$$;

revoke all on function private.guard_invitation_update() from public;

drop trigger if exists cafe_invitations_guard_update on public.cafe_invitations;
create trigger cafe_invitations_guard_update
before update on public.cafe_invitations
for each row
execute function private.guard_invitation_update();

-- ---------------------------------------------------------------------------
-- 5) Tighten membership UPDATE with check: prevent role column games by managers
--    (user_id/cafe_id already immutable via trigger)
-- ---------------------------------------------------------------------------

drop policy if exists "memberships_update_roles" on public.memberships;

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
