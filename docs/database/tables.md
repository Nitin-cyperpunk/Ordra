# Cafe tables (Module 7 + Module 10 QR)

Tenant-scoped physical table configuration for each cafe.

## Model

- `cafe_table_sections` — optional areas (Indoor, Terrace, …)
- `cafe_tables` — tables with per-cafe `code`, `capacity`, `status`, optional `section_id`
- `public_token` — stable opaque public id for QR / guest links (immutable; not the table UUID)
- `sort_order` — reserved for future list / floor-plan ordering

## Public projection (Module 10)

View: `public.public_cafe_tables` — `cafe_id`, `code`, `public_token`, `status` where
`status = active` only.

Guest URLs:

- Cafe QR: `/c/{cafeSlug}`
- Table QR: `/c/{cafeSlug}?table={public_token}`

Owner UI: Dashboard → Tables → QR (per table) or Cafe QR.

Migration: `20260815210000_public_cafe_tables_for_qr.sql`

## Status

`active` | `inactive` only.

Inactive tables do **not** appear in `public_cafe_tables` and do not establish
guest table context. Prefer deactivate over delete.

Do **not** extend this enum with occupied / reserved / dirty. Future booking and order modules should model occupancy in their own tables and join to `cafe_tables.id`.

## Delete policy

Prefer **deactivate**. Hard delete is allowed for owner/manager during setup; once bookings/orders reference tables, switch FKs to `ON DELETE RESTRICT` and remove hard delete from the UI.

## Future extensions (not implemented)

| Feature | Approach |
|---|---|
| Floor plan | Add nullable `position_x` / `position_y` / `rotation` later; keep `id` + `cafe_id` stable |
| Token regeneration | Explicit owner action only; invalidates old QR — not shipped yet |
| Booking | Reference `cafe_tables.id`; filter `status = active` |
| Orders / occupancy | Separate session/order rows; never mutate table `status` for occupancy |
| Audit log | Events: created, renamed, capacity changed, activated, deactivated, deleted |

## RBAC

| Role | Read | Write |
|---|---|---|
| owner | yes | yes |
| manager | yes | yes |
| staff | yes | no |
| anon / public | active rows via `public_cafe_tables` only | no |

## Route

`/dashboard/cafes/[cafeId]/tables` (authenticated; `robots: noindex`)
`/dashboard/cafes/[cafeId]/tables/qr` — cafe menu QR
`/dashboard/cafes/[cafeId]/tables/[tableId]/qr` — table QR
