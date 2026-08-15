# Cafe menu (Module 8)

Internal menu management for each cafe tenant.

## Model

- `menu_categories` — name, description, `display_order`, `is_active`
- `menu_items` — category, name, description, `price numeric(10,2)`, `diet`, `is_available`, `image_path`, `display_order`

Currency lives on `cafes.currency` (default INR). Item rows store amounts only.

## Delete policy

- Prefer **deactivate** category (`is_active = false`) and **unavailable** item (`is_available = false`).
- Category hard delete only when it has **no items** (`ON DELETE RESTRICT` on items → categories).
- Item hard delete allowed for setup mistakes; future orders should FK to `menu_items.id` with RESTRICT and stop exposing delete in UI.

## Storage

Bucket: `cafe-assets` (public read for future digital menu).

Path:

```text
cafe/{cafe_id}/menu/{item_id}/{uuid}.{ext}
```

MIME: png/jpeg/webp · max 2 MiB. Writes: owner/manager via Storage RLS + `private.storage_object_cafe_id`.

HEIC and CDN/image transforms are deferred.

## Public digital menu (Module 9 — first slice)

Guest URL: `/c/{slug}` — see `docs/database/public-menu.md`.

Public SELECT RLS allows active cafe + active categories + available items only.
Writes remain owner/manager.

## RBAC

| Role | Read | Write / images |
|---|---|---|
| owner | yes | yes |
| manager | yes | yes |
| staff | yes | no |

## Route

`/dashboard/cafes/[cafeId]/menu` (`robots: noindex`)
