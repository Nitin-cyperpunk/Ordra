-- Limit Data API surface for cafes to row-level CRUD only.
-- TRUNCATE is not subject to RLS and must not be available to authenticated.

revoke all on table public.cafes from authenticated;

grant select, insert, update, delete on table public.cafes to authenticated;
