-- Avoid auth.jwt() inside RLS/triggers: its request.jwt.claim fallback can
-- interact badly with claim.* GUCs. Read email from explicit settings only.

create or replace function private.jwt_email()
returns text
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  claims_raw text;
  claim_email text;
  claims_email text;
begin
  claim_email := nullif(current_setting('request.jwt.claim.email', true), '');

  claims_raw := nullif(current_setting('request.jwt.claims', true), '');
  if claims_raw is not null then
    begin
      claims_email := nullif(claims_raw::jsonb ->> 'email', '');
    exception when others then
      claims_email := null;
    end;
  end if;

  return lower(coalesce(claim_email, claims_email, ''));
end;
$$;

revoke all on function private.jwt_email() from public;
