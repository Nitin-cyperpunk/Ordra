# Database Schema (Foundation)

> No tables are created in this initialization phase. This document defines intent.

## Principles

1. Every tenant-owned table includes `cafe_id` (UUID, NOT NULL, FK to `cafes`).
2. Prefer UUIDs for public identifiers.
3. Use `created_at` / `updated_at` timestamps (timestamptz).
4. Enable RLS on every exposed table.
5. Soft-delete only when product requires history; otherwise hard delete with audit logs.

## Planned core entities

| Entity | Tenant scoped | Notes |
|---|---|---|
| `cafes` | — (tenant root) | **Implemented (Module 2)** — `owner_id` + membership-aware RLS |
| `memberships` | yes | **Implemented (Module 3)** — roles: owner/manager/staff |
| `cafe_invitations` | yes | **Implemented (Module 3)** — email invite architecture |
| `profiles` / finer RBAC | yes | Later refinement |
| `tables` | yes | Floor / QR |
| `menu_categories` | yes | |
| `menu_items` | yes | |
| `orders` | yes | |
| `order_items` | yes | |
| `payments` | yes | Razorpay refs |
| `subscriptions` | cafe-level | SaaS billing |

## Implemented: `public.cafes`

Columns: `id`, `name`, `slug` (unique), `owner_id` → `auth.users`, `created_at`, `updated_at`.

RLS (authenticated): select/insert/update/delete only when `owner_id = auth.uid()`.

## Migrations

SQL migrations will live in `database/migrations/` and be applied via Supabase CLI.

## What you should learn

- Modeling multi-tenant schemas
- When FK cascades vs restrict
- Migrating safely in production
