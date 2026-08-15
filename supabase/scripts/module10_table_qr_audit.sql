-- Module 10: public cafe table QR exposure + write isolation (rolled back).

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

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'authenticated',
    'authenticated',
    'm10-owner-a@ordra.test',
    crypt('audit-only', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'authenticated',
    'authenticated',
    'm10-owner-b@ordra.test',
    crypt('audit-only', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  );

insert into public.cafes (id, name, slug, owner_id, status)
values
  (
    '11111111-1111-1111-1111-111111111111',
    'Cafe A',
    'cafe-a',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'active'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'Cafe B',
    'cafe-b',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'active'
  );

insert into public.cafe_tables (id, cafe_id, code, capacity, status, public_token)
values
  (
    '33333333-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111111',
    'A1',
    4,
    'active',
    'token-a'
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    '11111111-1111-1111-1111-111111111111',
    'A9',
    2,
    'inactive',
    'token-a-inactive'
  ),
  (
    '55555555-5555-5555-5555-555555555555',
    '22222222-2222-2222-2222-222222222222',
    'B1',
    4,
    'active',
    'token-b'
  );

-- As anon
reset role;
execute 'set local role anon';
perform set_config('request.jwt.claim.role', 'anon', true);

select pg_temp.record(
  'public_view_active_token_a',
  '1',
  (
    select count(*)::text
    from public.public_cafe_tables
    where public_token = 'token-a'
      and cafe_id = '11111111-1111-1111-1111-111111111111'
  )
);

select pg_temp.record(
  'public_view_hides_inactive',
  '0',
  (
    select count(*)::text
    from public.public_cafe_tables
    where public_token = 'token-a-inactive'
  )
);

select pg_temp.record(
  'cross_cafe_token_b_on_cafe_a',
  '0',
  (
    select count(*)::text
    from public.public_cafe_tables
    where public_token = 'token-b'
      and cafe_id = '11111111-1111-1111-1111-111111111111'
  )
);

select pg_temp.record(
  'public_view_has_no_table_id_column',
  'missing',
  case
    when exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'public_cafe_tables'
        and column_name = 'id'
    ) then 'present'
    else 'missing'
  end
);

-- Anon cannot insert into cafe_tables
do $$
declare blocked boolean := false;
begin
  begin
    insert into public.cafe_tables (cafe_id, code, capacity)
    values ('11111111-1111-1111-1111-111111111111', 'HACK', 1);
  exception when insufficient_privilege then
    blocked := true;
  when others then
    if sqlstate = '42501' then
      blocked := true;
    end if;
  end;
  perform pg_temp.record(
    'anon_cannot_insert_tables',
    'blocked',
    case when blocked then 'blocked' else 'allowed' end
  );
end $$;

reset role;

select scenario, expected, actual, passed
from audit_results
order by scenario;

do $$
declare failures int;
begin
  select count(*) into failures from audit_results where not passed;
  if failures > 0 then
    raise exception 'Module 10 table QR audit failed: % scenario(s)', failures;
  end if;
end $$;

rollback;
