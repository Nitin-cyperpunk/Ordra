-- Module 4 attack-scenario verification (transaction rolled back).

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
  ('audit-owner-a@ordra.test'),
  ('audit-owner-b@ordra.test'),
  ('audit-staff-a@ordra.test'),
  ('audit-manager-a@ordra.test')
) as e(email);

insert into audit_users (label, id, email)
select 'owner_a', id, email from auth.users where email = 'audit-owner-a@ordra.test';
insert into audit_users (label, id, email)
select 'owner_b', id, email from auth.users where email = 'audit-owner-b@ordra.test';
insert into audit_users (label, id, email)
select 'staff_a', id, email from auth.users where email = 'audit-staff-a@ordra.test';
insert into audit_users (label, id, email)
select 'manager_a', id, email from auth.users where email = 'audit-manager-a@ordra.test';

insert into public.cafes (id, name, slug, owner_id)
select 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Cafe A', 'audit-cafe-a', id
from audit_users where label = 'owner_a';

insert into public.cafes (id, name, slug, owner_id)
select 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Cafe B', 'audit-cafe-b', id
from audit_users where label = 'owner_b';

insert into public.memberships (user_id, cafe_id, role)
select id, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'staff'
from audit_users where label = 'staff_a';

insert into public.memberships (user_id, cafe_id, role)
select id, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'manager'
from audit_users where label = 'manager_a';

insert into public.cafe_invitations (cafe_id, email, role, invited_by, status)
select
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'audit-staff-a@ordra.test',
  'staff',
  (select id from audit_users where label = 'owner_a'),
  'pending';

create or replace function pg_temp.as_user(p_user_id uuid, p_email text)
returns void
language plpgsql
as $$
begin
  execute 'reset role';
  -- Prefer a single claims JSON blob (matches PostgREST / Supabase Auth).
  perform set_config(
    'request.jwt.claims',
    json_build_object(
      'sub', p_user_id::text,
      'email', p_email,
      'role', 'authenticated'
    )::text,
    true
  );
  perform set_config('request.jwt.claim.sub', p_user_id::text, true);
  perform set_config('request.jwt.claim.email', p_email, true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);
  execute 'set local role authenticated';
end;
$$;

create or replace function pg_temp.reset_role()
returns void
language plpgsql
as $$
begin
  execute 'reset role';
end;
$$;

create or replace function pg_temp.record(
  p_scenario text,
  p_expected text,
  p_actual text,
  p_passed boolean
)
returns void
language plpgsql
as $$
begin
  execute 'reset role';
  insert into audit_results values (p_scenario, p_expected, p_actual, p_passed);
end;
$$;

-- 1) User A cannot SELECT Cafe B
do $$
declare
  uid uuid; email text; seen int;
begin
  select id, audit_users.email into uid, email from audit_users where label = 'owner_a';
  perform pg_temp.as_user(uid, email);
  select count(*) into seen from public.cafes where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  perform pg_temp.record('User A → Cafe B SELECT', '0 rows', seen || ' rows', seen = 0);
end $$;

-- 2) User A cannot UPDATE Cafe B
do $$
declare
  uid uuid; email text; updated int;
begin
  select id, audit_users.email into uid, email from audit_users where label = 'owner_a';
  perform pg_temp.as_user(uid, email);
  update public.cafes set name = 'Hacked' where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  get diagnostics updated = row_count;
  perform pg_temp.record('User A → Cafe B UPDATE', '0 rows', updated || ' rows', updated = 0);
end $$;

-- 3) Staff cannot UPDATE cafe settings
do $$
declare
  uid uuid; email text; updated int;
begin
  select id, audit_users.email into uid, email from audit_users where label = 'staff_a';
  perform pg_temp.as_user(uid, email);
  update public.cafes set name = 'Staff rename'
  where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  get diagnostics updated = row_count;
  perform pg_temp.record('Staff → Owner cafe UPDATE', '0 rows', updated || ' rows', updated = 0);
end $$;

-- 4) Staff cannot insert invitations
do $$
declare
  uid uuid; email text; ok boolean := false; err text;
begin
  select id, audit_users.email into uid, email from audit_users where label = 'staff_a';
  perform pg_temp.as_user(uid, email);
  begin
    insert into public.cafe_invitations (cafe_id, email, role, invited_by, status)
    values (
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      'someone@example.com',
      'staff',
      uid,
      'pending'
    );
    err := 'INSERTED';
  exception when others then
    ok := true;
    err := sqlerrm;
  end;
  perform pg_temp.record('Staff → invite INSERT', 'denied', coalesce(err, 'denied'), ok);
end $$;

-- 5) Staff cannot escalate own role
do $$
declare
  uid uuid; email text; updated int;
begin
  select id, audit_users.email into uid, email from audit_users where label = 'staff_a';
  perform pg_temp.as_user(uid, email);
  update public.memberships set role = 'owner'
  where user_id = uid and cafe_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  get diagnostics updated = row_count;
  perform pg_temp.record('Staff → self role escalate', '0 rows', updated || ' rows', updated = 0);
end $$;

-- 6) Manager cannot delete owner membership
do $$
declare
  uid uuid; email text; deleted int; owner_uid uuid;
begin
  select id, audit_users.email into uid, email from audit_users where label = 'manager_a';
  select id into owner_uid from audit_users where label = 'owner_a';
  perform pg_temp.as_user(uid, email);
  delete from public.memberships
  where user_id = owner_uid and cafe_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  get diagnostics deleted = row_count;
  perform pg_temp.record('Manager → delete owner membership', '0 rows', deleted || ' rows', deleted = 0);
end $$;

-- 7) Manager cannot escalate staff invite to manager
do $$
declare
  uid uuid; email text; ok boolean := false; err text := 'blocked';
  invite_id uuid;
begin
  select id, audit_users.email into uid, email from audit_users where label = 'manager_a';
  select i.id into invite_id from public.cafe_invitations i
  where i.email = 'audit-staff-a@ordra.test' and i.status = 'pending'
  limit 1;
  perform pg_temp.as_user(uid, email);
  begin
    update public.cafe_invitations
    set role = 'manager'
    where id = invite_id;
    err := 'no exception';
  exception when others then
    ok := true;
    err := sqlerrm;
  end;
  perform pg_temp.reset_role();
  if not ok then
    ok := exists (
      select 1 from public.cafe_invitations
      where id = invite_id and role = 'staff' and status = 'pending'
    );
    err := case when ok then 'role unchanged' else 'ESCALATED' end;
  end if;
  perform pg_temp.record('Manager → escalate invite role', 'denied / unchanged', err, ok);
end $$;

-- 8) Invitee cannot reassign invite cafe_id
do $$
declare
  uid uuid; email text; ok boolean := false; err text := 'blocked';
  invite_id uuid;
begin
  select id, audit_users.email into uid, email from audit_users where label = 'staff_a';
  select i.id into invite_id from public.cafe_invitations i
  where i.email = 'audit-staff-a@ordra.test' and i.status = 'pending'
  limit 1;
  perform pg_temp.as_user(uid, email);
  begin
    update public.cafe_invitations
    set cafe_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
    where id = invite_id;
    err := 'no exception';
  exception when others then
    ok := true;
    err := sqlerrm;
  end;
  perform pg_temp.reset_role();
  if not ok then
    ok := exists (
      select 1 from public.cafe_invitations
      where id = invite_id
        and cafe_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
    );
    err := case when ok then 'cafe_id unchanged' else 'REASSIGNED' end;
  end if;
  perform pg_temp.record('Manipulated cafe_id on invite', 'denied', err, ok);
end $$;

-- 9) anon cannot SELECT cafes
do $$
declare
  seen int; ok boolean := false; err text;
begin
  execute 'reset role';
  execute 'set local role anon';
  begin
    select count(*) into seen from public.cafes;
    ok := (seen = 0);
    err := seen || ' rows';
  exception when others then
    ok := true;
    err := sqlerrm;
  end;
  perform pg_temp.record('Unauthenticated → cafes SELECT', 'denied or 0', err, ok);
end $$;

-- 10) Owner A cannot see Cafe B memberships
do $$
declare
  uid uuid; email text; seen int;
begin
  select id, audit_users.email into uid, email from audit_users where label = 'owner_a';
  perform pg_temp.as_user(uid, email);
  select count(*) into seen from public.memberships
  where cafe_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  perform pg_temp.record('User A → Cafe B memberships SELECT', '0 rows', seen || ' rows', seen = 0);
end $$;

-- 11) Positive control: owner A can select Cafe A
do $$
declare
  uid uuid; email text; seen int;
begin
  select id, audit_users.email into uid, email from audit_users where label = 'owner_a';
  perform pg_temp.as_user(uid, email);
  select count(*) into seen from public.cafes
  where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  perform pg_temp.record('Owner A → Cafe A SELECT (control)', '1 row', seen || ' rows', seen = 1);
end $$;

-- 12) Membership rekey blocked
do $$
declare
  uid uuid; email text; ok boolean := false; err text;
  mid uuid;
begin
  select id, audit_users.email into uid, email from audit_users where label = 'owner_a';
  select m.id into mid from public.memberships m
  join audit_users u on u.id = m.user_id
  where u.label = 'staff_a';
  perform pg_temp.as_user(uid, email);
  begin
    update public.memberships
    set cafe_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
    where id = mid;
    err := 'UPDATED';
  exception when others then
    ok := true;
    err := sqlerrm;
  end;
  perform pg_temp.record('Manipulated membership cafe_id', 'denied', err, ok);
end $$;

select scenario, expected, actual, passed from audit_results order by scenario;

do $$
declare
  fails int;
begin
  execute 'reset role';
  select count(*) into fails from audit_results where not passed;
  if fails > 0 then
    raise exception 'SECURITY AUDIT FAILED: % scenario(s)', fails;
  end if;
end $$;

rollback;
