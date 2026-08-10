import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
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
