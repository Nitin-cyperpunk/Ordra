import type { Metadata } from "next";

import { CreateCafeForm } from "@/features/cafes/components/create-cafe-form";
import {
  getOnboardingState,
  redirectForOnboardingState,
} from "@/features/onboarding/state";

export const metadata: Metadata = {
  title: "Onboarding · Ordra",
};

export default async function OnboardingPage() {
  const state = await getOnboardingState();

  if (state !== "AUTHENTICATED_NO_CAFE") {
    await redirectForOnboardingState(state);
  }

  return (
    <main className="mx-auto w-full max-w-sm space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Create your cafe</h1>
        <p className="text-muted-foreground text-sm">
          No cafe workspace found. Create your cafe to continue.
        </p>
      </div>
      <CreateCafeForm />
    </main>
  );
}
