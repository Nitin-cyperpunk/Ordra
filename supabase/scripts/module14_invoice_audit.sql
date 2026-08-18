-- Module 14: invoices RLS / grant audit (read-only).
-- Confirms cafe isolation surface and that clients cannot write invoices.

select c.relname as table_name, c.relrowsecurity as rls, c.relforcerowsecurity as force_rls
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('invoices', 'invoice_items', 'cafe_invoice_counters')
order by 1;

select grantee, table_name, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('invoices', 'invoice_items', 'cafe_invoice_counters')
  and grantee in ('anon', 'authenticated', 'public')
order by table_name, grantee, privilege_type;

select polname, tablename, cmd, roles
from pg_policies
where schemaname = 'public'
  and tablename in ('invoices', 'invoice_items', 'cafe_invoice_counters')
order by tablename, polname;

select p.proname,
       has_function_privilege('anon', p.oid, 'execute') as anon_exec,
       has_function_privilege('authenticated', p.oid, 'execute') as auth_exec
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('issue_invoice_for_order', 'issue_guest_invoice', 'get_customer_invoice');

-- Expected:
-- cafe_invoice_counters: RLS + force RLS, no grants to anon/authenticated
-- invoices / invoice_items: SELECT only for authenticated members
-- issue_invoice_for_order: authenticated execute
-- issue_guest_invoice / get_customer_invoice: not executable by anon/authenticated
