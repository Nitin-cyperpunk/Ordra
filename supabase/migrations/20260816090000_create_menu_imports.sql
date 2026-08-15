-- Module 10.7: Smart menu import jobs + private storage.

create type public.menu_import_status as enum (
  'uploaded',
  'processing',
  'review',
  'completed',
  'failed'
);

create table public.menu_imports (
  id uuid primary key default gen_random_uuid(),
  cafe_id uuid not null references public.cafes (id) on delete cascade,
  created_by uuid not null references auth.users (id) on delete restrict,
  source_file_path text not null,
  source_file_name text not null,
  source_mime text not null,
  source_file_size integer not null,
  status public.menu_import_status not null default 'uploaded',
  provider text,
  extracted_payload jsonb,
  error_code text,
  approved_by uuid references auth.users (id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint menu_imports_file_name_length check (char_length(source_file_name) between 1 and 255),
  constraint menu_imports_path_length check (char_length(source_file_path) between 1 and 500),
  constraint menu_imports_mime_length check (char_length(source_mime) between 1 and 120),
  constraint menu_imports_size_positive check (source_file_size > 0 and source_file_size <= 20971520),
  constraint menu_imports_provider_length check (provider is null or char_length(provider) <= 80),
  constraint menu_imports_error_code_length check (error_code is null or char_length(error_code) <= 80)
);

create index menu_imports_cafe_id_idx on public.menu_imports (cafe_id);
create index menu_imports_cafe_status_idx on public.menu_imports (cafe_id, status, created_at desc);
create index menu_imports_created_by_idx on public.menu_imports (created_by);

comment on table public.menu_imports is
  'Module 10.7 smart menu import jobs. Extracted drafts stay in review until owner approval.';

create trigger menu_imports_set_updated_at
before update on public.menu_imports
for each row execute function public.set_updated_at();

-- Optional audit link on menu items
alter table public.menu_items
  add column if not exists source_import_id uuid references public.menu_imports (id) on delete set null;

create index if not exists menu_items_source_import_id_idx
  on public.menu_items (source_import_id);

-- RLS
alter table public.menu_imports enable row level security;
alter table public.menu_imports force row level security;

revoke all on table public.menu_imports from anon, public;
grant select, insert, update on table public.menu_imports to authenticated;

create policy "menu_imports_select_member"
on public.menu_imports
for select
to authenticated
using (private.is_cafe_member(cafe_id));

create policy "menu_imports_insert_managers"
on public.menu_imports
for insert
to authenticated
with check (
  private.current_user_cafe_role(cafe_id) in ('owner', 'manager')
  and created_by = (select auth.uid())
);

create policy "menu_imports_update_managers"
on public.menu_imports
for update
to authenticated
using (private.current_user_cafe_role(cafe_id) in ('owner', 'manager'))
with check (private.current_user_cafe_role(cafe_id) in ('owner', 'manager'));

-- Private storage bucket for original menu documents
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'menu-imports',
  'menu-imports',
  false,
  10485760,
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Path: cafe/{cafe_id}/imports/{import_id}/{filename}
drop policy if exists "menu_imports_storage_select_managers" on storage.objects;
create policy "menu_imports_storage_select_managers"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'menu-imports'
  and private.storage_object_cafe_id(name) is not null
  and private.current_user_cafe_role(private.storage_object_cafe_id(name))
    in ('owner', 'manager')
);

drop policy if exists "menu_imports_storage_insert_managers" on storage.objects;
create policy "menu_imports_storage_insert_managers"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'menu-imports'
  and private.storage_object_cafe_id(name) is not null
  and private.current_user_cafe_role(private.storage_object_cafe_id(name))
    in ('owner', 'manager')
);

drop policy if exists "menu_imports_storage_update_managers" on storage.objects;
create policy "menu_imports_storage_update_managers"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'menu-imports'
  and private.storage_object_cafe_id(name) is not null
  and private.current_user_cafe_role(private.storage_object_cafe_id(name))
    in ('owner', 'manager')
)
with check (
  bucket_id = 'menu-imports'
  and private.storage_object_cafe_id(name) is not null
  and private.current_user_cafe_role(private.storage_object_cafe_id(name))
    in ('owner', 'manager')
);

drop policy if exists "menu_imports_storage_delete_managers" on storage.objects;
create policy "menu_imports_storage_delete_managers"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'menu-imports'
  and private.storage_object_cafe_id(name) is not null
  and private.current_user_cafe_role(private.storage_object_cafe_id(name))
    in ('owner', 'manager')
);
