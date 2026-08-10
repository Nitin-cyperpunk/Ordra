# Database Schema (Foundation)

> No tables are created in this initialization phase. This document defines intent.

## Principles

1. Every tenant-owned table includes `cafe_id` (UUID, NOT NULL, FK to `cafes`).
2. Prefer UUIDs for public identifiers.
3. Use `created_at` / `updated_at` timestamps (timestamptz).
4. Enable RLS on every exposed table.
5. Soft-delete only when product requires history; otherwise hard delete with audit logs.

## Planned core entities (later)

| Entity | Tenant scoped | Notes |
|---|---|---|
| `cafes` | — | Tenant root |
| `profiles` / `memberships` | yes | User ↔ cafe roles |
| `tables` | yes | Floor / QR |
| `menu_categories` | yes | |
| `menu_items` | yes | |
| `orders` | yes | |
| `order_items` | yes | |
| `payments` | yes | Razorpay refs |
| `subscriptions` | cafe-level | SaaS billing |

## Migrations

SQL migrations will live in `database/migrations/` and be applied via Supabase CLI.

## What you should learn

- Modeling multi-tenant schemas
- When FK cascades vs restrict
- Migrating safely in production
