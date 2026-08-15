# Public digital menu (Module 9 — first slice)

Guest-facing, read-only cafe menu.

## URL

```text
/c/{cafeSlug}
```

Example: `https://ordra.com/c/blue-bean`

## Visibility rules (RLS)

| Data | Public if |
|---|---|
| Cafe | `status = active` (via `public_cafes` + column-limited `cafes`) |
| Category | `is_active` and cafe active |
| Item | `is_available`, category active, cafe active |
| Table context | `public_cafe_tables`: active + `cafe_id` matches cafe + `public_token` |

Migrations:
- `20260815183000_public_menu_read_policies.sql` — public row policies
- `20260815190000_harden_public_cafe_data_exposure.sql` — column exposure hardening
- `20260815210000_public_cafe_tables_for_qr.sql` — public table QR projection

## Public cafe projection (hardening)

View: `public.public_cafes` — safe columns only (`id`, `name`, `slug`, `description`,
`logo_url`, `currency`, `city`, `status`), `status = active` only.

Anon does **not** have full-table `SELECT` on `cafes`. Only public columns are granted.
Selecting `owner_id` / `email` / `phone` as anon must fail. App public menu reads use
`public_cafes`.

Private fields stay on `cafes` for authenticated members (`cafes_select_member`).

## Table QR context (Module 10)

URL: `/c/{cafeSlug}?table={public_token}`

Resolves only when token belongs to that cafe and table is active. Invalid/inactive/
cross-cafe tokens load the menu without table context (optional notice).

Guest response exposes table **code** only — not table UUID, capacity, or section.

Audit scripts:
- `supabase/scripts/public_cafe_exposure_audit.sql`
- `supabase/scripts/module10_table_qr_audit.sql`

## Out of scope (this slice)

- Cart / add to order
- Payments / invoice
- Token regeneration UI
- Anonymous writes

## Future flow

```text
QR → /c/{slug}?table={token} → Menu → [cart] → Order → Invoice
```
