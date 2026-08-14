-- Module 7 attack-scenario verification for cafe tables / sections.
-- Run against a disposable DB (transaction rolled back).
-- Requires Module 3–4 helpers (memberships, private.is_cafe_member, etc.).

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
  ('m7-owner-a@ordra.test'),
  ('m7-owner-b@ordra.test'),
  ('m7-staff-a@ordra.test'),
  ('m7-manager-a@ordra.test')
) as e(email);

insert into audit_users (label, id, email)
select 'owner_a', id, email from auth.users where email = 'm7-owner-a@ordra.test';
insert into audit_users (label, id, email)
select 'owner_b', id, email from auth.users where email = 'm7-owner-b@ordra.test';
insert into audit_users (label, id, email)
select 'staff_a', id, email from auth.users where email = 'm7-staff-a@ordra.test';
insert into audit_users (label, id, email)
select 'manager_a', id, email from auth.users where email = 'm7-manager-a@ordra.test';

insert into public.cafes (id, name, slug, owner_id)
select 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Cafe A', 'm7-cafe-a', id
from audit_users where label = 'owner_a';

insert into public.cafes (id, name, slug, owner_id)
select 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Cafe B', 'm7-cafe-b', id
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

create or replace function pg_temp.record(
  p_scenario text,
  p_expected text,
  p_actual text
) returns void
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

-- Seed section + table as owner A (bypass via reset role + service-like insert)
reset role;
insert into public.cafe_table_sections (id, cafe_id, name)
values (
  '11111111-1111-1111-1111-111111111111',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Indoor'
);

insert into public.cafe_table_sections (id, cafe_id, name)
values (
  '22222222-2222-2222-2222-222222222222',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'Patio B'
);

insert into public.cafe_tables (id, cafe_id, code, capacity, section_id)
values (
  '33333333-3333-3333-3333-333333333333',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'T01',
  4,
  '11111111-1111-1111-1111-111111111111'
);

insert into public.cafe_tables (id, cafe_id, code, capacity)
values (
  '44444444-4444-4444-4444-444444444444',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'T01',
  2
);

-- 1) Same code allowed across cafes (already seeded T01 / T01)
select pg_temp.record(
  'cross_cafe_same_code_allowed',
  '2',
  (select count(*)::text from public.cafe_tables where code = 'T01')
);

-- 2) Duplicate code in same cafe rejected
do $$
declare
  failed boolean := false;
begin
  begin
    insert into public.cafe_tables (cafe_id, code, capacity)
    values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'T01', 4);
  exception when unique_violation then
    failed := true;
  end;
  perform pg_temp.record('duplicate_code_same_cafe', 'blocked', case when failed then 'blocked' else 'allowed' end);
end $$;

-- 3) Owner A cannot read Cafe B tables
do $$
declare
  n int;
begin
  perform pg_temp.as_user(
    (select id from audit_users where label = 'owner_a'),
    'm7-owner-a@ordra.test'
  );
  select count(*) into n from public.cafe_tables
  where cafe_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  perform pg_temp.record('owner_a_cannot_read_cafe_b', '0', n::text);
end $$;

-- 4) Staff can read Cafe A but cannot insert
do $$
declare
  n int;
  blocked boolean := false;
begin
  perform pg_temp.as_user(
    (select id from audit_users where label = 'staff_a'),
    'm7-staff-a@ordra.test'
  );
  select count(*) into n from public.cafe_tables
  where cafe_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  perform pg_temp.record('staff_can_read_cafe_a', '1', least(n, 1)::text);

  begin
    insert into public.cafe_tables (cafe_id, code, capacity)
    values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'T99', 2);
  exception when insufficient_privilege then
    blocked := true;
  when others then
    -- RLS often raises with SQLSTATE 42501 or returns 0 rows on update;
    -- insert under RLS typically raises.
    if sqlerrm ilike '%policy%' or sqlerrm ilike '%permission%' then
      blocked := true;
    end if;
  end;

  -- If insert "succeeded" under RLS it should not be visible; check existence.
  if not blocked then
    select count(*) into n from public.cafe_tables where code = 'T99';
    blocked := n = 0;
  end if;

  perform pg_temp.record('staff_cannot_insert', 'blocked', case when blocked then 'blocked' else 'allowed' end);
end $$;

-- 5) Manager can insert in Cafe A
do $$
declare
  ok boolean := false;
begin
  perform pg_temp.as_user(
    (select id from audit_users where label = 'manager_a'),
    'm7-manager-a@ordra.test'
  );
  begin
    insert into public.cafe_tables (cafe_id, code, capacity)
    values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'T02', 4);
    ok := true;
  exception when others then
    ok := false;
  end;
  perform pg_temp.record('manager_can_insert', 'ok', case when ok then 'ok' else 'fail' end);
end $$;

-- 6) Cross-cafe section assignment blocked
do $$
declare
  blocked boolean := false;
begin
  perform pg_temp.as_user(
    (select id from audit_users where label = 'owner_a'),
    'm7-owner-a@ordra.test'
  );
  begin
    update public.cafe_tables
    set section_id = '22222222-2222-2222-2222-222222222222'
    where id = '33333333-3333-3333-3333-333333333333';
  exception when others then
    blocked := true;
  end;
  perform pg_temp.record(
    'cross_cafe_section_blocked',
    'blocked',
    case when blocked then 'blocked' else 'allowed' end
  );
end $$;

-- 7) Owner A cannot update Cafe B table
do $$
declare
  n int;
begin
  perform pg_temp.as_user(
    (select id from audit_users where label = 'owner_a'),
    'm7-owner-a@ordra.test'
  );
  update public.cafe_tables
  set capacity = 99
  where id = '44444444-4444-4444-4444-444444444444';
  get diagnostics n = row_count;
  perform pg_temp.record('owner_a_cannot_update_cafe_b', '0', n::text);
end $$;

-- 8) cafe_id rekey blocked
do $$
declare
  blocked boolean := false;
begin
  reset role;
  begin
    update public.cafe_tables
    set cafe_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
    where id = '33333333-3333-3333-3333-333333333333';
  exception when others then
    blocked := true;
  end;
  perform pg_temp.record('cafe_id_rekey_blocked', 'blocked', case when blocked then 'blocked' else 'allowed' end);
end $$;

reset role;

select scenario, expected, actual, passed
from audit_results
order by scenario;

do $$
declare
  failures int;
begin
  select count(*) into failures from audit_results where not passed;
  if failures > 0 then
    raise exception 'Module 7 table RLS audit failed: % scenario(s)', failures;
  end if;
end $$;

rollback;
