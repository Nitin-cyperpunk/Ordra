import type { ReactNode } from "react";

import { logoutAction } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <p className="text-sm font-medium tracking-wide">Ordra</p>
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
