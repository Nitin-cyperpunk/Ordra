-- Module 9: Public read-only digital menu.
-- Allows anonymous visitors (and signed-in non-members) to read:
--   - active cafes
--   - active categories belonging to those cafes
--   - available items in those active categories
-- Does NOT open writes. Cart / orders / QR table deep-links are future work.

-- ---------------------------------------------------------------------------
-- Grants (RLS still required)
-- ---------------------------------------------------------------------------

grant select on table public.cafes to anon;
grant select on table public.menu_categories to anon;
grant select on table public.menu_items to anon;

-- ---------------------------------------------------------------------------
-- Policies — OR'd with existing member policies for authenticated users
-- ---------------------------------------------------------------------------

create policy "cafes_select_public_active"
on public.cafes
for select
to anon, authenticated
using (status = 'active');

create policy "menu_categories_select_public_active"
on public.menu_categories
for select
to anon, authenticated
using (
  is_active
  and exists (
    select 1
    from public.cafes c
    where c.id = cafe_id
      and c.status = 'active'
  )
);

create policy "menu_items_select_public_available"
on public.menu_items
for select
to anon, authenticated
using (
  is_available
  and exists (
    select 1
    from public.cafes c
    where c.id = cafe_id
      and c.status = 'active'
  )
  and exists (
    select 1
    from public.menu_categories cat
    where cat.id = category_id
      and cat.cafe_id = cafe_id
      and cat.is_active
  )
);

comment on policy "cafes_select_public_active" on public.cafes is
  'Module 9: public digital menu — active cafes visible by slug.';
comment on policy "menu_categories_select_public_active" on public.menu_categories is
  'Module 9: public digital menu — active categories only.';
comment on policy "menu_items_select_public_available" on public.menu_items is
  'Module 9: public digital menu — available items in active categories only.';
