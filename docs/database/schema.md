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
| `tables` / `cafe_tables` | yes | **Module 7** — `cafe_tables` + `cafe_table_sections`; see `docs/database/tables.md` |
| `menu_categories` / `menu_items` | yes | **Module 8** — see `docs/database/menu.md` |
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

## Implemented: `public.cafe_table_sections` + `public.cafe_tables` (Module 7 + 10)

**Sections:** `id`, `cafe_id`, `name` (unique per cafe, case-insensitive), `sort_order`, timestamps.

**Tables:** `id`, `cafe_id`, `code` (unique per cafe), `capacity` (1–99), `status` (`active`|`inactive`),
optional `section_id`, `public_token` (opaque QR id), `sort_order`, timestamps.

**RLS:** members SELECT; owner/manager INSERT/UPDATE/DELETE. `cafe_id` and `public_token` immutable.
Same-cafe section enforced by trigger. Prefer deactivate over hard delete.

**Public QR (Module 10):** view `public.public_cafe_tables` (active only). Guest URL
`/c/{slug}?table={public_token}`. Owner QR under Tables. Migration
`20260815210000_public_cafe_tables_for_qr.sql`.

See `docs/database/tables.md` and `supabase/scripts/module10_table_qr_audit.sql`.

## Implemented: `public.menu_categories` + `public.menu_items` (Module 8)

**Categories:** unique name per cafe, `display_order`, `is_active`.

**Items:** `price numeric(10,2)`, `diet` (`vegetarian`|`non_vegetarian`), `is_available`,
`image_path` (Storage path in `cafe-assets`), same-cafe category trigger, immutable `cafe_id`.

**RLS:** members SELECT; owner/manager write. Storage writes gated by cafe folder + role.

See `docs/database/menu.md` and `supabase/scripts/module8_menu_attack_scenarios.sql`.

## Implemented: public digital menu read (Module 9 — first slice)

Route: `/c/[cafeSlug]` (read-only). Anon + authenticated may SELECT active cafes,
active categories, and available items via
`20260815183000_public_menu_read_policies.sql`.

**Column hardening:** `public.public_cafes` view + anon column grants only
(`id`, `name`, `slug`, `description`, `logo_url`, `currency`, `city`, `status`).
Migration: `20260815190000_harden_public_cafe_data_exposure.sql`.

See `docs/database/public-menu.md`. Cart / orders deferred; table QR context is Module 10.

## Implemented: customer orders (Module 11)

Tables: `orders`, `order_items`, `cafe_order_counters`. Guest place/track via RPCs +
httpOnly session cookie. Staff dashboard + status machine. No payments/invoices.

See `docs/database/orders.md`. Migration `20260815220000_create_orders_and_order_items.sql`.

## Migrations

SQL migrations live in `supabase/migrations/` and are applied via Supabase CLI.

## What you should learn

- Modeling multi-tenant schemas
- When FK cascades vs restrict
- Migrating safely in production
