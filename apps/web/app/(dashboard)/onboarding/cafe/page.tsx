import type { Metadata } from "next";

import { CreateCafeForm } from "@/features/cafes/components/create-cafe-form";

export const metadata: Metadata = {
  title: "Create cafe · Ordra",
};

export default function OnboardingCafePage() {
  return (
    <main className="mx-auto w-full max-w-sm space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Create your cafe</h1>
        <p className="text-muted-foreground text-sm">
          This cafe becomes your workspace. Staff and memberships come later.
        </p>
      </div>
      <CreateCafeForm />
    </main>
  );
}
