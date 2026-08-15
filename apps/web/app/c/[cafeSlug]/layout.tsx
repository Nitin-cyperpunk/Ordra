import type { ReactNode } from "react";

export default function PublicCafeLayout({ children }: { children: ReactNode }) {
  return <div className="bg-background text-foreground min-h-screen">{children}</div>;
}
