# Tenant Isolation Audit (Module 4)

**Status:** PASS — security gate cleared for Module 5  
**Date:** 2026-08-11  
**Scope:** Auth, cafes, memberships, invitations, app clients, middleware

## Guarantee

A user belonging to Cafe A cannot read or mutate Cafe B data. Enforcement is in Postgres RLS + triggers; the app layer is defense-in-depth only.

## Tables audited

| Table | Tenant key | RLS | FORCE RLS | anon grants |
|---|---|---|---|---|
| `cafes` | root (`id`) | yes | yes | none |
| `memberships` | `cafe_id` | yes | yes | none |
| `cafe_invitations` | `cafe_id` | yes | yes | none |

## Policies audited

**cafes:** select member · insert own · update owner/manager · delete owner  
**memberships:** select tenant · insert managers · insert from invite · update roles · delete  
**cafe_invitations:** select · insert · update managers · accept invitee · delete  

Helpers: `private.is_cafe_member`, `private.current_user_cafe_role`, `private.jwt_email`, `private.invitation_email_matches_jwt`, owner-membership trigger, owner_id / membership rekey / invitation guard triggers.

## Vulnerabilities found & fixes applied

| Severity | Finding | Fix |
|---|---|---|
| High | `anon` had table privileges (RLS-only) | Revoked anon/public table grants |
| High | Invitee/manager could escalate invite role or reassign `cafe_id` via loose UPDATE policy | Split update policies + `guard_invitation_update` trigger |
| High | Membership `user_id`/`cafe_id` mutable via UPDATE | `prevent_membership_rekey` trigger |
| Medium | `FORCE RLS` off | Enabled on all tenant tables |
| Medium | `set_updated_at` mutable `search_path` | Locked `search_path = public` |
| Medium | `rls_auto_enable` executable by anon | Revoked EXECUTE |
| Medium | Admin client re-exported without `server-only` | `server-only` + removed barrel export |
| Low | UPDATE RLS bare `email` ambiguous (old vs new) | Id-based invitee helpers |
| Low | Authenticated lacked `USAGE` on `private` for new helpers | Granted schema USAGE; EXECUTE least-privilege |

Migrations: `20260810192040` … `20260810194105` (hardening series).

## Attack scenarios tested

Script: `supabase/scripts/module4_attack_scenarios.sql` (rolled back; no residual data).

| Scenario | Result |
|---|---|
| User A → Cafe B SELECT | PASS (0 rows) |
| User A → Cafe B UPDATE | PASS (0 rows) |
| User A → Cafe B memberships | PASS (0 rows) |
| Staff → cafe settings UPDATE | PASS (0 rows) |
| Staff → invite INSERT | PASS (RLS deny) |
| Staff → self role escalate | PASS (0 rows) |
| Manager → delete owner membership | PASS (0 rows) |
| Manager → escalate invite role | PASS (trigger deny) |
| Manipulated invite `cafe_id` | PASS (trigger deny) |
| Manipulated membership `cafe_id` | PASS (trigger deny) |
| Unauthenticated → cafes | PASS (permission denied) |
| Owner A → Cafe A SELECT (control) | PASS (1 row) |

## App / API surface

- Server Actions use user-scoped Supabase client (publishable key) — RLS applies.
- Browser Supabase client exists but is not used for cafe/membership queries.
- `createAdminClient` is unused in features; gated with `server-only`.
- Middleware: session refresh + auth gate only (not RBAC) — intentional; DB enforces tenancy.
- API routes: `/auth/callback` (code exchange), `/api/health` (no tenant data).

## Residual recommendations (non-blocking)

1. Enable Supabase Auth **leaked password protection** in the dashboard.
2. Keep future tenant tables with `cafe_id` + membership-based RLS from day one.
3. Never call service role from Client Components.

## Verdict

**PASS** — Module 5 may proceed.
