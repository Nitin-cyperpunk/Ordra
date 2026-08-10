# Multi-Tenancy

## Model

Ordra uses **shared database, shared schema, row-level isolation** via `cafe_id` + PostgreSQL RLS.

```text
Request → Authenticated user → membership(cafe_id, role) → RLS filters rows
```

## Why this model?

| Model | Pros | Cons | Verdict |
|---|---|---|---|
| DB-per-tenant | Strong isolation | Ops nightmare early | Too heavy for v1 |
| Schema-per-tenant | Medium isolation | Migration pain | Avoid for now |
| Shared + RLS | Simple ops, scales far | Must never skip RLS | **Chosen** |

This is the common path for SaaS products like Supabase-backed apps and many B2B tools.

## Rules

- Never trust `cafe_id` from the client without verifying membership.
- Service role key is server-only and used sparingly.
- Super-admin paths must be explicit and audited.

## What you should learn

- RLS policies as security boundary
- JWT claims vs database lookups for authorization
- Tenant context propagation in server code
