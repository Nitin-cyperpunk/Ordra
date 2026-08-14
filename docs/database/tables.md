# Cafe tables (Module 7)

Tenant-scoped physical table configuration for each cafe.

## Model

- `cafe_table_sections` — optional areas (Indoor, Terrace, …)
- `cafe_tables` — tables with per-cafe `code`, `capacity`, `status`, optional `section_id`
- `public_token` — stable opaque public id for **future** QR / guest links (not generated as QR yet)
- `sort_order` — reserved for future list / floor-plan ordering

## Status

`active` | `inactive` only.

Do **not** extend this enum with occupied / reserved / dirty. Future booking and order modules should model occupancy in their own tables and join to `cafe_tables.id`.

## Delete policy

Prefer **deactivate**. Hard delete is allowed for owner/manager during setup; once bookings/orders reference tables, switch FKs to `ON DELETE RESTRICT` and remove hard delete from the UI.

## Future extensions (not implemented)

| Feature | Approach |
|---|---|
| Floor plan | Add nullable `position_x` / `position_y` / `rotation` later; keep `id` + `cafe_id` stable |
| QR ordering | Encode `public_token` (not UUID) into QR URLs |
| Booking | Reference `cafe_tables.id`; filter `status = active` |
| Orders / occupancy | Separate session/order rows; never mutate table `status` for occupancy |
| Audit log | Events: created, renamed, capacity changed, activated, deactivated, deleted |

## RBAC

| Role | Read | Write |
|---|---|---|
| owner | yes | yes |
| manager | yes | yes |
| staff | yes | no |

## Route

`/dashboard/cafes/[cafeId]/tables` (authenticated; `robots: noindex`)
