import type { ReactNode } from "react";

import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <p className="text-muted-foreground text-sm uppercase tracking-[0.2em]">
            Ordra
          </p>
        </div>
        {children}
      </div>
    </main>
  );
}
