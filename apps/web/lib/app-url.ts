/**
 * Application public base URL (no trailing slash).
 * Uses NEXT_PUBLIC_APP_URL — never hardcode localhost or production hosts.
 */
export function getAppUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_APP_URL is not configured.");
  }
  return url.replace(/\/$/, "");
}
