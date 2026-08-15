import { getAppUrl } from "@/lib/app-url";

/** Cafe-wide public menu URL (no table context). */
export function buildCafeMenuUrl(cafeSlug: string): string {
  const slug = cafeSlug.trim().toLowerCase();
  return `${getAppUrl()}/c/${encodeURIComponent(slug)}`;
}

/** Table QR URL — opaque public_token only (never table UUID). */
export function buildTableMenuUrl(cafeSlug: string, publicToken: string): string {
  const slug = cafeSlug.trim().toLowerCase();
  const token = publicToken.trim();
  const base = `${getAppUrl()}/c/${encodeURIComponent(slug)}`;
  const params = new URLSearchParams({ table: token });
  return `${base}?${params.toString()}`;
}

/** Filesystem-safe download basename without extension. */
export function buildQrDownloadBasename(opts: {
  cafeSlug: string;
  tableCode?: string;
}): string {
  const cafe = sanitizeSegment(opts.cafeSlug) || "cafe";
  if (opts.tableCode) {
    const table = sanitizeSegment(opts.tableCode) || "table";
    return `ordra-${cafe}-table-${table}`;
  }
  return `ordra-${cafe}-menu`;
}

function sanitizeSegment(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}
