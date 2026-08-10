-- Avoid bare `email` in invitation RLS: on UPDATE, old+new make it ambiguous
-- when queries also filter by email. Match invitees via id helpers instead.

create or replace function private.invitation_email_matches_jwt(p_invite_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.cafe_invitations i
    where i.id = p_invite_id
      and lower(i.email) = private.jwt_email()
  );
$$;

revoke all on function private.invitation_email_matches_jwt(uuid) from public;
grant execute on function private.invitation_email_matches_jwt(uuid) to authenticated;

drop policy if exists "invitations_select" on public.cafe_invitations;
drop policy if exists "invitations_accept_invitee" on public.cafe_invitations;

create policy "invitations_select"
on public.cafe_invitations
for select
to authenticated
using (
  private.current_user_cafe_role(cafe_id) in ('owner', 'manager')
  or private.invitation_email_matches_jwt(id)
);

create policy "invitations_accept_invitee"
on public.cafe_invitations
for update
to authenticated
using (
  status = 'pending'
  and private.invitation_email_matches_jwt(id)
)
with check (
  status = 'accepted'
  and role in ('manager', 'staff')
);
