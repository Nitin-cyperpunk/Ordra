-- Public cafe data exposure hardening verification (transaction rolled back).
-- Requires Module 9 public menu policies + 20260815190000 hardening migration.

begin;

create temporary table audit_results (
  scenario text primary key,
  expected text not null,
  actual text not null,
  passed boolean not null
) on commit drop;

create or replace function pg_temp.record(p_scenario text, p_expected text, p_actual text)
returns void
language plpgsql
as $$
begin
  insert into audit_results (scenario, expected, actual, passed)
  values (p_scenario, p_expected, p_actual, p_expected = p_actual)
  on conflict (scenario) do update
    set expected = excluded.expected,
        actual = excluded.actual,
        passed = excluded.passed;
end;
$$;

-- Seed two cafes: one active (public), one inactive
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
)
values (
  '00000000-0000-0000-0000-000000000000',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'authenticated',
  'authenticated',
  'harden-owner@ordra.test',
  crypt('audit-only', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  now(),
  now()
);

insert into public.cafes (
  id, name, slug, owner_id, status, email, phone, description, city, currency
)
values
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Public Bean',
    'public-bean',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'active',
    'private@cafe.test',
    '+919999999999',
    'Public description',
    'Nashik',
    'INR'
  ),
  (
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'Hidden Bean',
    'hidden-bean',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'inactive',
    'hidden@cafe.test',
    '+918888888888',
    'Should not appear',
    'Pune',
    'INR'
  );

insert into public.menu_categories (id, cafe_id, name, is_active)
values
  ('11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Coffee', true),
  ('22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Hidden Cat', false);

insert into public.menu_items (id, cafe_id, category_id, name, price, is_available)
values
  (
    '33333333-3333-3333-3333-333333333333',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '11111111-1111-1111-1111-111111111111',
    'Latte',
    149.00,
    true
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '11111111-1111-1111-1111-111111111111',
    'Sold Out Mocha',
    169.00,
    false
  );

-- As anon
reset role;
execute 'set local role anon';
perform set_config('request.jwt.claim.role', 'anon', true);

-- public_cafes shows active only
select pg_temp.record(
  'public_cafes_active_visible',
  '1',
  (select count(*)::text from public.public_cafes where slug = 'public-bean')
);

select pg_temp.record(
  'public_cafes_inactive_hidden',
  '0',
  (select count(*)::text from public.public_cafes where slug = 'hidden-bean')
);

-- owner_id / email / phone must not exist on public_cafes
select pg_temp.record(
  'public_cafes_has_no_owner_id_column',
  'missing',
  case
    when exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'public_cafes'
        and column_name = 'owner_id'
    ) then 'present'
    else 'missing'
  end
);

select pg_temp.record(
  'public_cafes_has_no_email_column',
  'missing',
  case
    when exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'public_cafes'
        and column_name = 'email'
    ) then 'present'
    else 'missing'
  end
);

select pg_temp.record(
  'public_cafes_has_no_phone_column',
  'missing',
  case
    when exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'public_cafes'
        and column_name = 'phone'
    ) then 'present'
    else 'missing'
  end
);

-- Direct cafes.owner_id as anon must fail (no column privilege)
do $$
declare
  blocked boolean := false;
  leaked text;
begin
  begin
    execute 'select owner_id::text from public.cafes where slug = ''public-bean''' into leaked;
  exception
    when insufficient_privilege then
      blocked := true;
    when undefined_column then
      blocked := true;
    when others then
      if sqlstate = '42501' then
        blocked := true;
      end if;
  end;

  perform pg_temp.record(
    'anon_cannot_read_cafes_owner_id',
    'blocked',
    case
      when blocked then 'blocked'
      when leaked is not null then 'leaked:' || leaked
      else 'unexpected_empty'
    end
  );
end $$;

-- Direct cafes.email as anon must fail
do $$
declare
  blocked boolean := false;
  leaked text;
begin
  begin
    execute 'select email from public.cafes where slug = ''public-bean''' into leaked;
  exception
    when insufficient_privilege then
      blocked := true;
    when others then
      if sqlstate = '42501' then
        blocked := true;
      end if;
  end;

  perform pg_temp.record(
    'anon_cannot_read_cafes_email',
    'blocked',
    case
      when blocked then 'blocked'
      when leaked is not null then 'leaked:' || leaked
      else 'unexpected_empty'
    end
  );
end $$;

-- Direct cafes.phone as anon must fail
do $$
declare
  blocked boolean := false;
  leaked text;
begin
  begin
    execute 'select phone from public.cafes where slug = ''public-bean''' into leaked;
  exception
    when insufficient_privilege then
      blocked := true;
    when others then
      if sqlstate = '42501' then
        blocked := true;
      end if;
  end;

  perform pg_temp.record(
    'anon_cannot_read_cafes_phone',
    'blocked',
    case
      when blocked then 'blocked'
      when leaked is not null then 'leaked:' || leaked
      else 'unexpected_empty'
    end
  );
end $$;

-- Anon may read only public columns from cafes (active)
select pg_temp.record(
  'anon_can_read_public_cafe_name',
  'Public Bean',
  coalesce(
    (select name from public.cafes where slug = 'public-bean'),
    'missing'
  )
);

-- Menu visibility as anon
select pg_temp.record(
  'anon_sees_available_item',
  '1',
  (
    select count(*)::text
    from public.menu_items
    where cafe_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
      and name = 'Latte'
  )
);

select pg_temp.record(
  'anon_hides_unavailable_item',
  '0',
  (
    select count(*)::text
    from public.menu_items
    where cafe_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
      and name = 'Sold Out Mocha'
  )
);

select pg_temp.record(
  'anon_hides_inactive_category',
  '0',
  (
    select count(*)::text
    from public.menu_categories
    where cafe_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
      and name = 'Hidden Cat'
  )
);

reset role;

select scenario, expected, actual, passed
from audit_results
order by scenario;

do $$
declare failures int;
begin
  select count(*) into failures from audit_results where not passed;
  if failures > 0 then
    raise exception 'Public cafe exposure audit failed: % scenario(s)', failures;
  end if;
end $$;

rollback;
