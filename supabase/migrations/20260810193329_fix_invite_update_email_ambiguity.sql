-- Postgres UPDATE RLS: the same unqualified column in USING + WITH CHECK
-- makes "email" ambiguous (old vs new row). Keep email match in USING only;
-- immutability + invitee accept rules stay in private.guard_invitation_update.

drop policy if exists "invitations_accept_invitee" on public.cafe_invitations;

create policy "invitations_accept_invitee"
on public.cafe_invitations
for update
to authenticated
using (
  status = 'pending'
  and lower(email) = private.jwt_email()
)
with check (
  status = 'accepted'
  and role in ('manager', 'staff')
);
