/**
 * Cafe logo / cover Storage architecture.
 *
 * Bucket `cafe-assets` ships with Module 8 (menu images). Logo/cover upload UI
 * remains deferred but can reuse the same bucket and path helpers.
 *
 * ## Bucket
 * - Name: `cafe-assets`
 * - Public read for display URLs
 * - Max file size: 2 MiB
 * - Allowed MIME: image/png, image/jpeg, image/webp
 *
 * ## Path structure (tenant-scoped)
 * ```text
 * cafe/{cafe_id}/logo/{uuid}.{ext}
 * cafe/{cafe_id}/cover/{uuid}.{ext}
 * cafe/{cafe_id}/menu/{item_id}/{uuid}.{ext}
 * ```
 *
 * ## Authorization
 * - INSERT/UPDATE/DELETE: owner or manager of that cafe_id path segment (Storage RLS)
 * - SELECT: public (bucket is public for future digital menu)
 * - Staff: read-only; no upload
 *
 * See `features/menu/storage.ts` and migration `20260814200100_create_cafe_assets_storage.sql`.
 */

export const CAFE_ASSETS_BUCKET = "cafe-assets";
export const CAFE_LOGO_MAX_BYTES = 2 * 1024 * 1024;
export const CAFE_LOGO_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;

export function cafeLogoObjectPath(cafeId: string, fileId: string, ext: string): string {
  return `cafe/${cafeId}/logo/${fileId}.${ext}`;
}
