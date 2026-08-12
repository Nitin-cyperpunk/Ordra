-- Module 6: Cafe profile & settings fields.
-- Extends public.cafes; existing member SELECT / owner-manager UPDATE RLS still applies.
-- Owner_id remains immutable via existing trigger.

create type public.cafe_status as enum ('active', 'inactive');

comment on type public.cafe_status is
  'Operational cafe flag. inactive disables operations without deleting data.';

alter table public.cafes
  add column description text,
  add column logo_url text,
  add column cover_image_url text,
  add column phone text,
  add column email text,
  add column website text,
  add column address_line1 text,
  add column address_line2 text,
  add column city text,
  add column state text,
  add column country text,
  add column postal_code text,
  add column timezone text not null default 'Asia/Kolkata',
  add column currency text not null default 'INR',
  add column status public.cafe_status not null default 'active',
  add column opening_hours jsonb not null default '{
    "monday":    {"closed": false, "open": "09:00", "close": "21:00"},
    "tuesday":   {"closed": false, "open": "09:00", "close": "21:00"},
    "wednesday": {"closed": false, "open": "09:00", "close": "21:00"},
    "thursday":  {"closed": false, "open": "09:00", "close": "21:00"},
    "friday":    {"closed": false, "open": "09:00", "close": "21:00"},
    "saturday":  {"closed": false, "open": "09:00", "close": "21:00"},
    "sunday":    {"closed": true,  "open": null,    "close": null}
  }'::jsonb;

comment on column public.cafes.description is 'Public-facing cafe description (plain text).';
comment on column public.cafes.logo_url is
  'Cafe logo URL/path. Upload via Storage deferred; column reserved for tenant-scoped assets.';
comment on column public.cafes.cover_image_url is
  'Cover image URL/path. Storage upload deferred.';
comment on column public.cafes.phone is 'Public contact phone.';
comment on column public.cafes.email is 'Public contact email (not auth identity).';
comment on column public.cafes.website is 'Public website URL.';
comment on column public.cafes.address_line1 is 'Street address line 1.';
comment on column public.cafes.address_line2 is 'Street address line 2.';
comment on column public.cafes.city is 'City.';
comment on column public.cafes.state is 'State / province / region.';
comment on column public.cafes.country is 'Country.';
comment on column public.cafes.postal_code is 'Postal / ZIP code.';
comment on column public.cafes.timezone is 'IANA timezone (e.g. Asia/Kolkata). Default for India launch; not a permanent platform lock.';
comment on column public.cafes.currency is 'ISO 4217 currency code. Default INR; configurable per cafe.';
comment on column public.cafes.status is 'active | inactive. Soft disable — never deletes data.';
comment on column public.cafes.opening_hours is
  'Weekly schedule JSON: { day: { closed, open, close } }. open/close are HH:MM or null when closed.';

alter table public.cafes
  add constraint cafes_description_length
    check (description is null or char_length(description) <= 2000),
  add constraint cafes_phone_length
    check (phone is null or char_length(trim(phone)) between 5 and 30),
  add constraint cafes_email_format
    check (
      email is null
      or email ~* '^[^\s@]+@[^\s@]+\.[^\s@]+$'
    ),
  add constraint cafes_website_length
    check (website is null or char_length(website) <= 300),
  add constraint cafes_timezone_length
    check (char_length(timezone) between 3 and 64),
  add constraint cafes_currency_format
    check (currency ~ '^[A-Z]{3}$'),
  add constraint cafes_opening_hours_is_object
    check (jsonb_typeof(opening_hours) = 'object');

create index cafes_status_idx on public.cafes (status);
