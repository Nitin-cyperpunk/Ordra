import { redirect } from "next/navigation";

import { resolveActiveCafe } from "@/features/memberships/active-cafe";
import { createClient } from "@/lib/supabase/server";

export const ONBOARDING_STATES = [
  "UNAUTHENTICATED",
  "AUTHENTICATED_NO_CAFE",
  "AUTHENTICATED_WITH_CAFE",
] as const;

export type OnboardingState = (typeof ONBOARDING_STATES)[number];

/** Pure classifier — memberships come from the authenticated user's DB rows. */
export function classifyOnboardingState(input: {
  authenticated: boolean;
  membershipCount: number;
}): OnboardingState {
  if (!input.authenticated) return "UNAUTHENTICATED";
  if (input.membershipCount <= 0) return "AUTHENTICATED_NO_CAFE";
  return "AUTHENTICATED_WITH_CAFE";
}

export async function getOnboardingState(): Promise<OnboardingState> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const authenticated = !error && typeof data?.claims?.sub === "string";

  if (!authenticated) {
    return "UNAUTHENTICATED";
  }

  const { count, error: countError } = await supabase
    .from("memberships")
    .select("id", { count: "exact", head: true });

  if (countError) {
    throw new Error(countError.message);
  }

  return classifyOnboardingState({
    authenticated: true,
    membershipCount: count ?? 0,
  });
}

/** Route helper: send the user to the right place for their onboarding state. */
export async function redirectForOnboardingState(state: OnboardingState): Promise<void> {
  if (state === "UNAUTHENTICATED") {
    redirect("/login");
  }

  if (state === "AUTHENTICATED_WITH_CAFE") {
    const active = await resolveActiveCafe();
    if (active) {
      redirect(`/dashboard/cafes/${active.cafeId}`);
    }
    redirect("/dashboard");
  }
}
