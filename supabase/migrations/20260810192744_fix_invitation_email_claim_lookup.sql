-- Fix invitee email matching: prefer request.jwt.claim.email and qualify columns.
-- Avoids ambiguous/fragile auth.jwt() parsing when claim.* GUCs are present.

create or replace function private.jwt_email()
returns text
language sql
stable
security invoker
set search_path = public
as $$
  select lower(
    coalesce(
      nullif(current_setting('request.jwt.claim.email', true), ''),
      nullif(auth.jwt() ->> 'email', ''),
      ''
    )
  );
$$;

revoke all on function private.jwt_email() from public;

create or replace function private.guard_invitation_update()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  actor_role public.cafe_role;
  jwt_email text := private.jwt_email();
begin
  if new.cafe_id is distinct from old.cafe_id
     or new.token is distinct from old.token
     or new.invited_by is distinct from old.invited_by
     or lower(new.email) is distinct from lower(old.email) then
    raise exception 'invitation cafe_id, email, token, and invited_by cannot be changed';
  end if;

  actor_role := private.current_user_cafe_role(old.cafe_id);

  if actor_role is null then
    if not (
      old.status = 'pending'
      and new.status = 'accepted'
      and new.role = old.role
      and lower(old.email) = jwt_email
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

drop policy if exists "invitations_select" on public.cafe_invitations;
drop policy if exists "invitations_accept_invitee" on public.cafe_invitations;

create policy "invitations_select"
on public.cafe_invitations
for select
to authenticated
using (
  private.current_user_cafe_role(cafe_id) in ('owner', 'manager')
  or lower(cafe_invitations.email) = private.jwt_email()
);

create policy "invitations_accept_invitee"
on public.cafe_invitations
for update
to authenticated
using (
  status = 'pending'
  and lower(cafe_invitations.email) = private.jwt_email()
)
with check (
  status = 'accepted'
  and role in ('manager', 'staff')
  and lower(cafe_invitations.email) = private.jwt_email()
);

-- Keep memberships_insert_from_invite email match consistent
drop policy if exists "memberships_insert_from_invite" on public.memberships;

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
    where i.cafe_id = memberships.cafe_id
      and i.status = 'pending'
      and i.role = memberships.role
      and lower(i.email) = private.jwt_email()
  )
);
