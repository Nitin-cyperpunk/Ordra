/**
 * Cafe logo / cover Storage architecture (Module 6 — deferred implementation).
 *
 * Storage is enabled in supabase/config.toml but no buckets or policies exist yet.
 * Do not wire a hacky client-only upload. Implement with a dedicated migration when ready.
 *
 * ## Bucket
 * - Name: `cafe-assets`
 * - Public read for logo/cover display (or signed URLs if private later)
 * - Max file size: 2 MiB
 * - Allowed MIME: image/png, image/jpeg, image/webp
 *
 * ## Path structure (tenant-scoped)
 * ```text
 * cafe/{cafe_id}/logo/{uuid}.{ext}
 * cafe/{cafe_id}/cover/{uuid}.{ext}
 * ```
 * Never trust client-provided cafe_id alone — verify membership (owner/manager)
 * in a Server Action before creating a signed upload URL or accepting the object.
 *
 * ## Authorization
 * - INSERT/UPDATE/DELETE: owner or manager of that cafe_id path segment
 * - SELECT: public (for logo_url) OR authenticated members — product decision
 * - Staff: read-only; no upload
 *
 * ## App columns
 * - `cafes.logo_url` / `cafes.cover_image_url` store the public URL or storage path
 *   after a successful upload. Until Storage ships, leave these null / manual URL.
 *
 * ## Security checklist
 * - Validate MIME + size server-side
 * - Reject path traversal and foreign cafe_id prefixes
 * - RLS on storage.objects using private.is_cafe_member / current_user_cafe_role
 */

export const CAFE_ASSETS_BUCKET = "cafe-assets";
export const CAFE_LOGO_MAX_BYTES = 2 * 1024 * 1024;
export const CAFE_LOGO_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;

export function cafeLogoObjectPath(cafeId: string, fileId: string, ext: string): string {
  return `cafe/${cafeId}/logo/${fileId}.${ext}`;
}
