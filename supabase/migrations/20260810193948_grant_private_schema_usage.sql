-- Authenticated callers need USAGE on `private` to resolve helpers referenced by RLS.
-- Tables stay out of the Data API (only public/graphql_public are exposed).
-- EXECUTE remains revoked by default; only explicitly granted helpers are callable.

grant usage on schema private to authenticated;

revoke all on function private.handle_cafe_created() from public, anon, authenticated;
revoke all on function private.prevent_membership_rekey() from public, anon, authenticated;
revoke all on function private.prevent_cafe_owner_reassign() from public, anon, authenticated;
revoke all on function private.guard_invitation_update() from public, anon, authenticated;
