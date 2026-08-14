/**
 * Menu / cafe asset Storage helpers (Module 8).
 * Bucket + RLS: supabase/migrations/20260814200100_create_cafe_assets_storage.sql
 */

export const CAFE_ASSETS_BUCKET = "cafe-assets";
export const MENU_IMAGE_MAX_BYTES = 2 * 1024 * 1024;
export const MENU_IMAGE_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;

export type MenuImageMime = (typeof MENU_IMAGE_MIME_TYPES)[number];

const MIME_TO_EXT: Record<MenuImageMime, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

export function isAllowedMenuImageMime(value: string): value is MenuImageMime {
  return (MENU_IMAGE_MIME_TYPES as readonly string[]).includes(value);
}

export function menuItemImageObjectPath(
  cafeId: string,
  itemId: string,
  fileId: string,
  mime: MenuImageMime,
): string {
  return `cafe/${cafeId}/menu/${itemId}/${fileId}.${MIME_TO_EXT[mime]}`;
}

export function publicCafeAssetUrl(supabaseUrl: string, objectPath: string): string {
  const base = supabaseUrl.replace(/\/$/, "");
  return `${base}/storage/v1/object/public/${CAFE_ASSETS_BUCKET}/${objectPath}`;
}
