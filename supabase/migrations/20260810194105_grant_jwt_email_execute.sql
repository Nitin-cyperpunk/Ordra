-- jwt_email is SECURITY INVOKER and is called from RLS / DEFINER helpers.
-- Authenticated must be able to EXECUTE it (it only reads JWT claim settings).

grant execute on function private.jwt_email() to authenticated;

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
      and lower(i.email) = lower(
        coalesce(
          nullif(current_setting('request.jwt.claim.email', true), ''),
          nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email',
          ''
        )
      )
  );
$$;

revoke all on function private.invitation_email_matches_jwt(uuid) from public;
grant execute on function private.invitation_email_matches_jwt(uuid) to authenticated;
