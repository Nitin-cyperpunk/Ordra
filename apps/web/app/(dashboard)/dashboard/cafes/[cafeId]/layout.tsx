import type { ReactNode } from "react";

import { requireCafeAccess } from "@/features/memberships/access";
import { SyncActiveCafe } from "@/features/memberships/components/sync-active-cafe";
import { CafeNav } from "@/features/cafes/components/cafe-nav";

type CafeLayoutProps = {
  children: ReactNode;
  params: Promise<{ cafeId: string }>;
};

export default async function CafeLayout({ children, params }: CafeLayoutProps) {
  const { cafeId } = await params;
  const { cafe } = await requireCafeAccess(cafeId);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <SyncActiveCafe cafeId={cafeId} />
      <div className="space-y-3 border-b pb-4 print:hidden">
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-[0.18em]">
            Your cafe
          </p>
          <h1 className="truncate text-xl font-semibold tracking-tight sm:text-2xl">
            {cafe.name}
          </h1>
        </div>
        <CafeNav cafeId={cafeId} />
      </div>
      {children}
    </div>
  );
}
