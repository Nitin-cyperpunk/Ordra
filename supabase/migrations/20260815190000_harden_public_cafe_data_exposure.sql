-- Harden public cafe column exposure (pre–Module 10).
-- Module 9 row filters remain for menu_categories / menu_items.
-- Anon must not SELECT private columns from public.cafes (owner_id, email, phone, …).

-- ---------------------------------------------------------------------------
-- 1) Public cafe projection (safe columns only)
-- ---------------------------------------------------------------------------
-- security_invoker = false (Postgres default / SECURITY DEFINER behavior):
-- the view runs with the view owner's rights and bypasses RLS on cafes.
-- That is intentional for a stable public projection. Safety comes from:
--   (a) explicit column list
--   (b) WHERE status = 'active'
-- Never add private columns to this view.
--
-- App public menu reads SHOULD use public.public_cafes (not public.cafes).

create or replace view public.public_cafes
with (security_invoker = false)
as
select
  id,
  name,
  slug,
  description,
  logo_url,
  currency,
  city,
  status
from public.cafes
where status = 'active';

comment on view public.public_cafes is
  'Public digital menu cafe projection. Safe columns only; active cafes only. '
  'Do not add owner_id, email, phone, address, or internal settings.';

revoke all on public.public_cafes from public, anon, authenticated;
grant select on public.public_cafes to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2) Column-level SELECT for anon on cafes (no private columns)
-- ---------------------------------------------------------------------------
-- RLS alone is row-level. PostgREST select=* previously returned owner_id,
-- email, phone, etc. Revoke table SELECT, then grant only public columns.
--
-- Column grants are ALSO required so Module 9 menu policies that
--   exists (select 1 from public.cafes c where c.id = cafe_id and c.status = 'active')
-- continue to evaluate for anon (they need SELECT on id/status at minimum).

revoke select on table public.cafes from anon;

grant select (
  id,
  name,
  slug,
  description,
  logo_url,
  currency,
  city,
  status
) on table public.cafes to anon;

-- Keep the Module 9 public row filter so:
--   (a) direct anon SELECT on cafes only returns active rows
--   (b) menu_categories / menu_items public EXISTS checks keep working
-- Policy already exists from 20260815183000; recreate if missing.
drop policy if exists "cafes_select_public_active" on public.cafes;

create policy "cafes_select_public_active"
on public.cafes
for select
to anon, authenticated
using (status = 'active');

comment on policy "cafes_select_public_active" on public.cafes is
  'Module 9/hardening: active cafes only; anon limited to public columns via GRANT.';
