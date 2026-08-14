-- Public Coming Soon waitlist.
-- Anon/authenticated may INSERT pending rows only. No public SELECT/UPDATE/DELETE.

create type public.waitlist_status as enum ('pending', 'contacted', 'archived');

create table public.waitlist (
  id uuid primary key default gen_random_uuid(),
  cafe_name text not null,
  owner_name text not null,
  phone text not null,
  email text not null,
  cafe_address text not null,
  status public.waitlist_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint waitlist_cafe_name_length check (char_length(trim(cafe_name)) between 2 and 120),
  constraint waitlist_owner_name_length check (char_length(trim(owner_name)) between 2 and 100),
  constraint waitlist_phone_length check (char_length(trim(phone)) between 8 and 20),
  constraint waitlist_email_format check (position('@' in email) > 1),
  constraint waitlist_address_length check (char_length(trim(cafe_address)) between 5 and 300)
);

comment on table public.waitlist is
  'Public waitlist from Coming Soon. INSERT-only for anon; no public reads.';

-- One submission per email (case-insensitive). Re-submits get a friendly app message.
-- Avoids insecure anon UPDATE/upsert while still blocking spam duplicates.
create unique index waitlist_email_unique on public.waitlist (lower(email));

create index waitlist_created_at_idx on public.waitlist (created_at desc);
create index waitlist_status_idx on public.waitlist (status);

create trigger waitlist_set_updated_at
before update on public.waitlist
for each row
execute function public.set_updated_at();

alter table public.waitlist enable row level security;
alter table public.waitlist force row level security;

revoke all on table public.waitlist from public, anon, authenticated;
grant insert on table public.waitlist to anon, authenticated;

create policy "waitlist_insert_public"
on public.waitlist
for insert
to anon, authenticated
with check (status = 'pending');

-- No SELECT / UPDATE / DELETE policies for anon or authenticated.
