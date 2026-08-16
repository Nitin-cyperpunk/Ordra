-- Module 10.7: Atomic menu import commit (human-approved draft → categories/items).

create or replace function public.commit_menu_import(
  p_import_id uuid,
  p_cafe_id uuid,
  p_draft jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_status public.menu_import_status;
  v_uid uuid := auth.uid();
  v_category jsonb;
  v_item jsonb;
  v_category_id uuid;
  v_category_name text;
  v_item_name text;
  v_price numeric;
  v_description text;
  v_diet public.menu_item_diet;
  v_created_items integer := 0;
  v_skipped_items integer := 0;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  v_role := private.current_user_cafe_role(p_cafe_id);
  if v_role is distinct from 'owner' and v_role is distinct from 'manager' then
    raise exception 'Not authorized';
  end if;

  select status into v_status
  from public.menu_imports
  where id = p_import_id
    and cafe_id = p_cafe_id
  for update;

  if v_status is null then
    raise exception 'Import not found';
  end if;

  if v_status is distinct from 'review' then
    raise exception 'Import is not ready for approval';
  end if;

  if p_draft is null or jsonb_typeof(p_draft->'categories') is distinct from 'array' then
    raise exception 'Invalid draft';
  end if;

  for v_category in
    select value from jsonb_array_elements(p_draft->'categories')
  loop
    v_category_name := nullif(trim(both from coalesce(v_category->>'name', '')), '');
    if v_category_name is null then
      continue;
    end if;
    if char_length(v_category_name) > 80 then
      v_category_name := left(v_category_name, 80);
    end if;

    select id into v_category_id
    from public.menu_categories
    where cafe_id = p_cafe_id
      and lower(name) = lower(v_category_name)
    limit 1;

    if v_category_id is null then
      insert into public.menu_categories (cafe_id, name, is_active)
      values (p_cafe_id, v_category_name, true)
      returning id into v_category_id;
    end if;

    if jsonb_typeof(v_category->'items') is distinct from 'array' then
      continue;
    end if;

    for v_item in
      select value from jsonb_array_elements(v_category->'items')
    loop
      if coalesce((v_item->>'selected')::boolean, false) is not true then
        continue;
      end if;

      v_item_name := nullif(trim(both from coalesce(v_item->>'name', '')), '');
      if v_item_name is null then
        continue;
      end if;
      if char_length(v_item_name) > 120 then
        v_item_name := left(v_item_name, 120);
      end if;

      if v_item->>'price' is null or v_item->>'price' = 'null' then
        continue;
      end if;

      begin
        v_price := (v_item->>'price')::numeric;
      exception
        when others then
          continue;
      end;

      if v_price is null or v_price <= 0 or v_price > 99999999.99 then
        continue;
      end if;

      if exists (
        select 1
        from public.menu_items
        where cafe_id = p_cafe_id
          and lower(name) = lower(v_item_name)
      ) then
        v_skipped_items := v_skipped_items + 1;
        continue;
      end if;

      v_description := nullif(trim(both from coalesce(v_item->>'description', '')), '');
      if v_description is not null and char_length(v_description) > 2000 then
        v_description := left(v_description, 2000);
      end if;

      if coalesce(v_item->>'diet', '') in ('vegetarian', 'non_vegetarian') then
        v_diet := (v_item->>'diet')::public.menu_item_diet;
      else
        v_diet := 'vegetarian';
      end if;

      insert into public.menu_items (
        cafe_id,
        category_id,
        name,
        description,
        price,
        diet,
        is_available,
        source_import_id
      ) values (
        p_cafe_id,
        v_category_id,
        v_item_name,
        v_description,
        v_price,
        v_diet,
        true,
        p_import_id
      );

      v_created_items := v_created_items + 1;
    end loop;
  end loop;

  if v_created_items = 0 and v_skipped_items = 0 then
    raise exception 'No items selected for import';
  end if;

  update public.menu_imports
  set
    status = 'completed',
    extracted_payload = p_draft,
    approved_by = v_uid,
    approved_at = now(),
    completed_at = now(),
    error_code = null
  where id = p_import_id
    and cafe_id = p_cafe_id;

  return jsonb_build_object(
    'created_items', v_created_items,
    'skipped_items', v_skipped_items
  );
end;
$$;

revoke all on function public.commit_menu_import(uuid, uuid, jsonb) from public;
grant execute on function public.commit_menu_import(uuid, uuid, jsonb) to authenticated;

comment on function public.commit_menu_import(uuid, uuid, jsonb) is
  'Atomically create menu categories/items from an approved import draft. Owner/manager only.';
