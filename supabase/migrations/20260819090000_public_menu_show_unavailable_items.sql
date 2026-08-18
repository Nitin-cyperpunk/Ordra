-- Module 13: guests may see unavailable items so the menu can label them.
-- Writes remain owner/manager only. No private cafe fields are exposed.

drop policy if exists "menu_items_select_public_available" on public.menu_items;

create policy "menu_items_select_public_menu"
on public.menu_items
for select
to anon, authenticated
using (
  exists (
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

comment on policy "menu_items_select_public_menu" on public.menu_items is
  'Module 13: public digital menu — items in active categories of active cafes, including unavailable.';
