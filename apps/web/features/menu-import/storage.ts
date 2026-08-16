export const MENU_IMPORTS_BUCKET = "menu-imports";

/** cafe/{cafeId}/imports/{importId}/{safeFileName} */
export function menuImportObjectPath(
  cafeId: string,
  importId: string,
  fileName: string,
): string {
  const safe = fileName
    .trim()
    .toLowerCase()
    .replace(/\\/g, "/")
    .split("/")
    .pop()
    ?.replace(/\.\./g, "")
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
  const base = safe || "menu";
  return `cafe/${cafeId}/imports/${importId}/${base}`;
}

export function extensionForMime(mime: string): string {
  switch (mime) {
    case "application/pdf":
      return "pdf";
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return "bin";
  }
}
