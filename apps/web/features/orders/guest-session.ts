import "server-only";

import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";

export const GUEST_SESSION_COOKIE = "ordra_guest_session";

export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

export function createGuestSessionId(): string {
  return randomBytes(24).toString("hex");
}

/** Read existing guest session or create one (Server Actions / Route Handlers). */
export async function ensureGuestSessionId(): Promise<string> {
  const store = await cookies();
  const existing = store.get(GUEST_SESSION_COOKIE)?.value;
  if (existing && existing.length >= 32) {
    return existing;
  }

  const id = createGuestSessionId();
  try {
    store.set(GUEST_SESSION_COOKIE, id, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
  } catch {
    // Server Components cannot set cookies; middleware seeds the cookie.
  }
  return id;
}

export async function getGuestSessionId(): Promise<string | null> {
  const store = await cookies();
  const value = store.get(GUEST_SESSION_COOKIE)?.value;
  if (!value || value.length < 32) return null;
  return value;
}
