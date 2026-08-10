import { cookies } from "next/headers";

import type { CafeRole } from "@/features/memberships/types";
import { createClient } from "@/lib/supabase/server";

export const ACTIVE_CAFE_COOKIE = "ordra_active_cafe_id";

export async function setActiveCafeId(cafeId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_CAFE_COOKIE, cafeId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}

export async function getActiveCafeIdFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(ACTIVE_CAFE_COOKIE)?.value ?? null;
}

export async function clearActiveCafeId(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ACTIVE_CAFE_COOKIE);
}

/** Resolve active cafe: cookie if still a member, else first membership. */
export async function resolveActiveCafe(): Promise<{
  cafeId: string;
  role: CafeRole;
} | null> {
  const supabase = await createClient();
  const { data: memberships, error } = await supabase
    .from("memberships")
    .select("cafe_id, role")
    .order("created_at", { ascending: true });

  if (error || !memberships?.length) {
    return null;
  }

  const cookieCafeId = await getActiveCafeIdFromCookie();
  const fromCookie = memberships.find((row) => row.cafe_id === cookieCafeId);
  if (fromCookie) {
    return {
      cafeId: fromCookie.cafe_id,
      role: fromCookie.role as CafeRole,
    };
  }

  const first = memberships[0];
  if (!first) return null;

  // Do not write cookies here — Server Components cannot modify cookies.
  // Persist via setActiveCafeAction / syncActiveCafeAction only.
  return {
    cafeId: first.cafe_id,
    role: first.role as CafeRole,
  };
}
