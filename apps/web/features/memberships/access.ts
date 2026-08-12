import { redirect } from "next/navigation";

import type { Cafe } from "@/features/cafes/types";
import type { CafeRole } from "@/features/memberships/types";
import { createClient } from "@/lib/supabase/server";
import { mapMembershipError } from "@/features/memberships/errors";
import { mapCafeError } from "@/features/cafes/errors";

export type CafeAccessContext = {
  user: { id: string; email: string | null };
  cafe: Cafe;
  role: CafeRole;
};

export type RequireCafeAccessOptions = {
  /** If set, membership role must be one of these. */
  roles?: readonly CafeRole[];
};

/**
 * Server-side cafe authorization.
 * Relies on RLS for tenant isolation; also verifies membership + optional role.
 */
export async function requireCafeAccess(
  cafeId: string,
  options: RequireCafeAccessOptions = {},
): Promise<CafeAccessContext> {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const sub = claimsData?.claims?.sub;
  const email = claimsData?.claims?.email;

  if (claimsError || typeof sub !== "string") {
    redirect("/login");
  }

  const user = {
    id: sub,
    email: typeof email === "string" ? email : null,
  };

  const { data: cafe, error: cafeError } = await supabase
    .from("cafes")
    .select("id, name, slug, owner_id, created_at, updated_at")
    .eq("id", cafeId)
    .maybeSingle();

  if (cafeError) {
    throw new Error(mapCafeError(cafeError));
  }

  if (!cafe) {
    redirect("/dashboard");
  }

  const { data: membership, error: membershipError } = await supabase
    .from("memberships")
    .select("role")
    .eq("cafe_id", cafeId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (membershipError) {
    throw new Error(mapMembershipError(membershipError));
  }

  if (!membership) {
    redirect("/dashboard");
  }

  const role = membership.role as CafeRole;

  if (options.roles && !options.roles.includes(role)) {
    redirect(`/dashboard/cafes/${cafeId}`);
  }

  return {
    user,
    cafe: cafe as Cafe,
    role,
  };
}

/** Pure helper for tests and shared role checks. */
export function membershipSatisfiesRoles(
  role: CafeRole,
  allowed?: readonly CafeRole[],
): boolean {
  if (!allowed || allowed.length === 0) return true;
  return allowed.includes(role);
}
