-- Module 8 attack-scenario verification for menu categories/items.
-- Transaction rolled back. Requires memberships helpers from Module 3–4.

begin;

create temporary table audit_users (
  label text primary key,
  id uuid not null,
  email text not null
) on commit drop;

create temporary table audit_results (
  scenario text primary key,
  expected text not null,
  actual text not null,
  passed boolean not null
) on commit drop;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
)
select
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  e.email,
  crypt('audit-only', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  now(),
  now()
from (values
  ('m8-owner-a@ordra.test'),
  ('m8-owner-b@ordra.test'),
  ('m8-staff-a@ordra.test'),
  ('m8-manager-a@ordra.test')
) as e(email);

insert into audit_users (label, id, email)
select 'owner_a', id, email from auth.users where email = 'm8-owner-a@ordra.test';
insert into audit_users (label, id, email)
select 'owner_b', id, email from auth.users where email = 'm8-owner-b@ordra.test';
insert into audit_users (label, id, email)
select 'staff_a', id, email from auth.users where email = 'm8-staff-a@ordra.test';
insert into audit_users (label, id, email)
select 'manager_a', id, email from auth.users where email = 'm8-manager-a@ordra.test';

insert into public.cafes (id, name, slug, owner_id)
select 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Cafe A', 'm8-cafe-a', id
from audit_users where label = 'owner_a';

insert into public.cafes (id, name, slug, owner_id)
select 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Cafe B', 'm8-cafe-b', id
from audit_users where label = 'owner_b';

insert into public.memberships (user_id, cafe_id, role)
select id, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'staff'
from audit_users where label = 'staff_a';

insert into public.memberships (user_id, cafe_id, role)
select id, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'manager'
from audit_users where label = 'manager_a';

create or replace function pg_temp.as_user(p_user_id uuid, p_email text)
returns void
language plpgsql
as $$
begin
  execute 'reset role';
  perform set_config('request.jwt.claim.sub', p_user_id::text, true);
  perform set_config('request.jwt.claim.email', p_email, true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);
  execute 'set local role authenticated';
end;
$$;

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

reset role;

insert into public.menu_categories (id, cafe_id, name)
values
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Coffee'),
  ('22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Coffee');

insert into public.menu_items (id, cafe_id, category_id, name, price)
values
  (
    '33333333-3333-3333-3333-333333333333',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '11111111-1111-1111-1111-111111111111',
    'Cappuccino',
    149.50
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '22222222-2222-2222-2222-222222222222',
    'Cappuccino',
    160.00
  );

-- Same category name across cafes allowed
select pg_temp.record(
  'cross_cafe_same_category_name',
  '2',
  (select count(*)::text from public.menu_categories where name = 'Coffee')
);

-- Duplicate category in same cafe blocked
do $$
declare failed boolean := false;
begin
  begin
    insert into public.menu_categories (cafe_id, name)
    values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Coffee');
  exception when unique_violation then
    failed := true;
  end;
  perform pg_temp.record('duplicate_category_same_cafe', 'blocked', case when failed then 'blocked' else 'allowed' end);
end $$;

-- Price > 0 enforced
do $$
declare failed boolean := false;
begin
  begin
    insert into public.menu_items (cafe_id, category_id, name, price)
    values (
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      '11111111-1111-1111-1111-111111111111',
      'Free Water',
      0
    );
  exception when check_violation then
    failed := true;
  end;
  perform pg_temp.record('zero_price_blocked', 'blocked', case when failed then 'blocked' else 'allowed' end);
end $$;

-- Owner A cannot read Cafe B items
do $$
declare n int;
begin
  perform pg_temp.as_user((select id from audit_users where label = 'owner_a'), 'm8-owner-a@ordra.test');
  select count(*) into n from public.menu_items where cafe_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  perform pg_temp.record('owner_a_cannot_read_cafe_b_items', '0', n::text);
end $$;

-- Staff can read Cafe A but cannot insert
do $$
declare
  n int;
  blocked boolean := false;
begin
  perform pg_temp.as_user((select id from audit_users where label = 'staff_a'), 'm8-staff-a@ordra.test');
  select count(*) into n from public.menu_items where cafe_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  perform pg_temp.record('staff_can_read_cafe_a', 'gte1', case when n >= 1 then 'gte1' else '0' end);

  begin
    insert into public.menu_items (cafe_id, category_id, name, price)
    values (
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      '11111111-1111-1111-1111-111111111111',
      'Staff Latte',
      120
    );
  exception when others then
    blocked := true;
  end;
  if not blocked then
    select count(*) into n from public.menu_items where name = 'Staff Latte';
    blocked := n = 0;
  end if;
  perform pg_temp.record('staff_cannot_insert_item', 'blocked', case when blocked then 'blocked' else 'allowed' end);
end $$;

-- Manager can insert
do $$
declare ok boolean := false;
begin
  perform pg_temp.as_user((select id from audit_users where label = 'manager_a'), 'm8-manager-a@ordra.test');
  begin
    insert into public.menu_items (cafe_id, category_id, name, price)
    values (
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      '11111111-1111-1111-1111-111111111111',
      'Manager Espresso',
      99
    );
    ok := true;
  exception when others then
    ok := false;
  end;
  perform pg_temp.record('manager_can_insert_item', 'ok', case when ok then 'ok' else 'fail' end);
end $$;

-- Cross-cafe category assignment blocked
do $$
declare blocked boolean := false;
begin
  perform pg_temp.as_user((select id from audit_users where label = 'owner_a'), 'm8-owner-a@ordra.test');
  begin
    update public.menu_items
    set category_id = '22222222-2222-2222-2222-222222222222'
    where id = '33333333-3333-3333-3333-333333333333';
  exception when others then
    blocked := true;
  end;
  perform pg_temp.record('cross_cafe_category_blocked', 'blocked', case when blocked then 'blocked' else 'allowed' end);
end $$;

-- Owner A cannot update Cafe B item
do $$
declare n int;
begin
  perform pg_temp.as_user((select id from audit_users where label = 'owner_a'), 'm8-owner-a@ordra.test');
  update public.menu_items set price = 1 where id = '44444444-4444-4444-4444-444444444444';
  get diagnostics n = row_count;
  perform pg_temp.record('owner_a_cannot_update_cafe_b_item', '0', n::text);
end $$;

-- cafe_id rekey blocked
do $$
declare blocked boolean := false;
begin
  reset role;
  begin
    update public.menu_items
    set cafe_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
    where id = '33333333-3333-3333-3333-333333333333';
  exception when others then
    blocked := true;
  end;
  perform pg_temp.record('menu_item_cafe_id_rekey_blocked', 'blocked', case when blocked then 'blocked' else 'allowed' end);
end $$;

-- Storage cafe id helper
select pg_temp.record(
  'storage_path_cafe_id',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  private.storage_object_cafe_id('cafe/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/menu/x/y.jpg')::text
);

reset role;

select scenario, expected, actual, passed from audit_results order by scenario;

do $$
declare failures int;
begin
  select count(*) into failures from audit_results where not passed;
  if failures > 0 then
    raise exception 'Module 8 menu RLS audit failed: % scenario(s)', failures;
  end if;
end $$;

rollback;
