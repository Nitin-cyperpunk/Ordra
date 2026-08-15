-- Module 10: Public-safe cafe table projection for QR deep-links.
-- Opaque public_token already exists on cafe_tables (Module 7).
-- Guests may resolve active table context for a cafe menu; no writes.

-- ---------------------------------------------------------------------------
-- public_cafe_tables — safe columns only, active tables only
-- ---------------------------------------------------------------------------
-- security_invoker = false: view owner reads cafe_tables; anon has no table SELECT.
-- Safety: explicit columns + WHERE status = 'active'.
-- Never add internal UUID id, section_id, capacity, or timestamps.

create or replace view public.public_cafe_tables
with (security_invoker = false)
as
select
  cafe_id,
  code,
  public_token,
  status
from public.cafe_tables
where status = 'active';

comment on view public.public_cafe_tables is
  'Public QR table context. Active tables only; code + public_token + cafe_id. '
  'Do not expose table UUID, capacity, section, or timestamps.';

revoke all on public.public_cafe_tables from public, anon, authenticated;
grant select on public.public_cafe_tables to anon, authenticated;

-- cafe_tables remains member-only for direct table access (Module 7 grants).
-- Anon must not INSERT/UPDATE/DELETE cafe_tables (already revoked).
