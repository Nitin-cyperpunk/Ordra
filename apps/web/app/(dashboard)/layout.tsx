import type { ReactNode } from "react";
import type { Metadata } from "next";

import { logoutAction } from "@/features/auth/actions";
import { resolveActiveCafe } from "@/features/memberships/active-cafe";
import { getMyCafeMemberships } from "@/features/memberships/actions";
import { CafeSwitcher } from "@/features/memberships/components/cafe-switcher";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  let memberships: Awaited<ReturnType<typeof getMyCafeMemberships>> = [];
  let activeCafeId: string | null = null;

  try {
    memberships = await getMyCafeMemberships();
    const active = await resolveActiveCafe();
    activeCafeId = active?.cafeId ?? null;
  } catch {
    // Auth middleware should catch unauthenticated users; keep layout resilient.
  }

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between gap-4 border-b px-6 py-4">
        <div className="flex min-w-0 items-center gap-4">
          <p className="text-sm font-medium tracking-wide">Ordra</p>
          <CafeSwitcher memberships={memberships} activeCafeId={activeCafeId} />
        </div>
        <form action={logoutAction}>
          <Button type="submit" variant="outline" size="sm">
            Sign out
          </Button>
        </form>
      </header>
      <div className="px-6 py-10">{children}</div>
    </div>
  );
}
