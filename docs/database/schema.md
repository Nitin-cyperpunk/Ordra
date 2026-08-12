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
| `cafes` | — (tenant root) | **Module 2+6** — profile, hours, status; membership-aware RLS |
| `memberships` | yes | **Implemented (Module 3)** — roles: owner/manager/staff |
| `cafe_invitations` | yes | **Implemented (Module 3)** — email invite architecture |
| `profiles` / finer RBAC | yes | Later refinement |
| `tables` | yes | Floor / QR (Module 7) |
| `menu_categories` | yes | |
| `menu_items` | yes | |
| `orders` | yes | |
| `order_items` | yes | |
| `payments` | yes | Razorpay refs |
| `subscriptions` | cafe-level | SaaS billing |

## Implemented: `public.cafes`

**Identity:** `id`, `name`, `slug` (unique), `owner_id` → `auth.users`, timestamps.

**Profile (Module 6):** `description`, `logo_url`, `cover_image_url`, `phone`, `email`,
`website`, `address_line1`, `address_line2`, `city`, `state`, `country`, `postal_code`.

**Business:** `timezone` (IANA, default `Asia/Kolkata`), `currency` (ISO 4217, default `INR`),
`status` (`active` | `inactive`), `opening_hours` (JSONB weekly schedule).

**RLS (authenticated):** members SELECT; owner/manager UPDATE; owner DELETE; insert as self-owner.
`owner_id` immutable via trigger. Storage upload for logos is deferred (see `features/cafes/storage.ts`).

## Migrations

SQL migrations live in `supabase/migrations/` and are applied via Supabase CLI.

## What you should learn

- Modeling multi-tenant schemas
- When FK cascades vs restrict
- Migrating safely in production
