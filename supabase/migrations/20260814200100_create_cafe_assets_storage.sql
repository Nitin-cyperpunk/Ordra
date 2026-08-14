-- Module 8: Cafe assets Storage bucket + tenant-scoped object policies.
-- Used for menu item images (and future cafe logo/cover).
-- Path convention: cafe/{cafe_id}/menu/{item_id}/{file}
--                  cafe/{cafe_id}/logo/{file}
--                  cafe/{cafe_id}/cover/{file}

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'cafe-assets',
  'cafe-assets',
  true,
  2097152,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Extract cafe UUID from object path first two segments: cafe/{uuid}/...
create or replace function private.storage_object_cafe_id(object_name text)
returns uuid
language plpgsql
immutable
set search_path = public
as $$
declare
  segment text;
begin
  if split_part(object_name, '/', 1) is distinct from 'cafe' then
    return null;
  end if;
  segment := split_part(object_name, '/', 2);
  if segment !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return null;
  end if;
  return segment::uuid;
end;
$$;

revoke all on function private.storage_object_cafe_id(text) from public;

-- Public read (future digital menu / QR). Writes remain role-gated.
drop policy if exists "cafe_assets_select_public" on storage.objects;
create policy "cafe_assets_select_public"
on storage.objects
for select
to public
using (bucket_id = 'cafe-assets');

drop policy if exists "cafe_assets_insert_managers" on storage.objects;
create policy "cafe_assets_insert_managers"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'cafe-assets'
  and private.storage_object_cafe_id(name) is not null
  and private.current_user_cafe_role(private.storage_object_cafe_id(name))
    in ('owner', 'manager')
);

drop policy if exists "cafe_assets_update_managers" on storage.objects;
create policy "cafe_assets_update_managers"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'cafe-assets'
  and private.storage_object_cafe_id(name) is not null
  and private.current_user_cafe_role(private.storage_object_cafe_id(name))
    in ('owner', 'manager')
)
with check (
  bucket_id = 'cafe-assets'
  and private.storage_object_cafe_id(name) is not null
  and private.current_user_cafe_role(private.storage_object_cafe_id(name))
    in ('owner', 'manager')
);

drop policy if exists "cafe_assets_delete_managers" on storage.objects;
create policy "cafe_assets_delete_managers"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'cafe-assets'
  and private.storage_object_cafe_id(name) is not null
  and private.current_user_cafe_role(private.storage_object_cafe_id(name))
    in ('owner', 'manager')
);
