-- Module 8: Menu categories + menu items (internal cafe menu management).
-- Tenant-scoped. Public digital menu / QR ordering / orders are future modules.

create type public.menu_item_diet as enum ('vegetarian', 'non_vegetarian');

comment on type public.menu_item_diet is
  'Primary diet label for Indian cafe menus. Extend later (vegan, jain, allergens) '
  'via additional columns/flags — do not overload this enum with every dietary trait.';

-- ---------------------------------------------------------------------------
-- menu_categories
-- ---------------------------------------------------------------------------

create table public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  cafe_id uuid not null references public.cafes (id) on delete cascade,
  name text not null,
  description text,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint menu_categories_name_length
    check (char_length(trim(name)) between 1 and 80),
  constraint menu_categories_description_length
    check (description is null or char_length(description) <= 500)
);

create unique index menu_categories_cafe_name_unique
  on public.menu_categories (cafe_id, lower(trim(name)));

create index menu_categories_cafe_id_idx on public.menu_categories (cafe_id);
create index menu_categories_cafe_active_order_idx
  on public.menu_categories (cafe_id, is_active, display_order);

comment on table public.menu_categories is
  'Cafe menu sections (Coffee, Snacks, …). Names unique per cafe, not globally.';

create trigger menu_categories_set_updated_at
before update on public.menu_categories
for each row
execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- menu_items
-- ---------------------------------------------------------------------------

create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  cafe_id uuid not null references public.cafes (id) on delete cascade,
  category_id uuid not null references public.menu_categories (id) on delete restrict,
  name text not null,
  description text,
  price numeric(10, 2) not null,
  image_path text,
  diet public.menu_item_diet not null default 'vegetarian',
  is_available boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint menu_items_name_length
    check (char_length(trim(name)) between 1 and 120),
  constraint menu_items_description_length
    check (description is null or char_length(description) <= 2000),
  constraint menu_items_price_positive
    check (price > 0),
  constraint menu_items_image_path_length
    check (image_path is null or char_length(image_path) <= 500)
);

create unique index menu_items_cafe_category_name_unique
  on public.menu_items (cafe_id, category_id, lower(trim(name)));

create index menu_items_cafe_id_idx on public.menu_items (cafe_id);
create index menu_items_category_id_idx on public.menu_items (category_id);
create index menu_items_cafe_available_order_idx
  on public.menu_items (cafe_id, is_available, display_order);
create index menu_items_cafe_diet_idx on public.menu_items (cafe_id, diet);

comment on table public.menu_items is
  'Cafe menu offerings. price is NUMERIC(10,2) in cafe currency (cafes.currency; default INR). '
  'image_path is a Storage object path in bucket cafe-assets (not a free-form URL). '
  'Stable ids support future QR ordering and order line references.';
comment on column public.menu_items.price is
  'Unit price in cafe currency. Never use floating-point for money math.';
comment on column public.menu_items.image_path is
  'Object path in cafe-assets, e.g. cafe/{cafe_id}/menu/{item_id}/{file}.ext';
comment on column public.menu_items.is_available is
  'Operational availability toggle. Distinct from soft-delete / archive.';

create trigger menu_items_set_updated_at
before update on public.menu_items
for each row
execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Immutable cafe_id + same-cafe category enforcement
-- ---------------------------------------------------------------------------

create or replace function private.prevent_menu_category_rekey()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.cafe_id is distinct from old.cafe_id then
    raise exception 'menu_categories.cafe_id cannot be changed';
  end if;
  return new;
end;
$$;

revoke all on function private.prevent_menu_category_rekey() from public;

create trigger menu_categories_prevent_rekey
before update on public.menu_categories
for each row
execute function private.prevent_menu_category_rekey();

create or replace function private.prevent_menu_item_rekey()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.cafe_id is distinct from old.cafe_id then
    raise exception 'menu_items.cafe_id cannot be changed';
  end if;
  return new;
end;
$$;

revoke all on function private.prevent_menu_item_rekey() from public;

create trigger menu_items_prevent_rekey
before update on public.menu_items
for each row
execute function private.prevent_menu_item_rekey();

create or replace function private.enforce_menu_item_category_same_cafe()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.menu_categories c
    where c.id = new.category_id
      and c.cafe_id = new.cafe_id
  ) then
    raise exception 'category must belong to the same cafe as the menu item';
  end if;
  return new;
end;
$$;

revoke all on function private.enforce_menu_item_category_same_cafe() from public;

create trigger menu_items_enforce_category_cafe
before insert or update of category_id, cafe_id on public.menu_items
for each row
execute function private.enforce_menu_item_category_same_cafe();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.menu_categories enable row level security;
alter table public.menu_categories force row level security;

alter table public.menu_items enable row level security;
alter table public.menu_items force row level security;

revoke all on table public.menu_categories from anon, public;
revoke all on table public.menu_items from anon, public;

grant select, insert, update, delete on table public.menu_categories to authenticated;
grant select, insert, update, delete on table public.menu_items to authenticated;

-- Categories: members read; owner/manager write
create policy "menu_categories_select_member"
on public.menu_categories
for select
to authenticated
using (private.is_cafe_member(cafe_id));

create policy "menu_categories_insert_managers"
on public.menu_categories
for insert
to authenticated
with check (
  private.current_user_cafe_role(cafe_id) in ('owner', 'manager')
);

create policy "menu_categories_update_managers"
on public.menu_categories
for update
to authenticated
using (
  private.current_user_cafe_role(cafe_id) in ('owner', 'manager')
)
with check (
  private.current_user_cafe_role(cafe_id) in ('owner', 'manager')
);

create policy "menu_categories_delete_managers"
on public.menu_categories
for delete
to authenticated
using (
  private.current_user_cafe_role(cafe_id) in ('owner', 'manager')
);

-- Items: members read; owner/manager write
create policy "menu_items_select_member"
on public.menu_items
for select
to authenticated
using (private.is_cafe_member(cafe_id));

create policy "menu_items_insert_managers"
on public.menu_items
for insert
to authenticated
with check (
  private.current_user_cafe_role(cafe_id) in ('owner', 'manager')
);

create policy "menu_items_update_managers"
on public.menu_items
for update
to authenticated
using (
  private.current_user_cafe_role(cafe_id) in ('owner', 'manager')
)
with check (
  private.current_user_cafe_role(cafe_id) in ('owner', 'manager')
);

create policy "menu_items_delete_managers"
on public.menu_items
for delete
to authenticated
using (
  private.current_user_cafe_role(cafe_id) in ('owner', 'manager')
);
