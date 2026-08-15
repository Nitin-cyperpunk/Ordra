import Link from "next/link";
import type { ReactNode } from "react";

import { requireCafeAccess } from "@/features/memberships/access";
import { canEditCafeSettings } from "@/features/memberships/types";
import { cn } from "@/lib/utils";

type SettingsLayoutProps = {
  children: ReactNode;
  params: Promise<{ cafeId: string }>;
};

const NAV = [
  { segment: "profile", label: "Cafe details" },
  { segment: "business", label: "Business" },
  { segment: "hours", label: "Opening hours" },
] as const;

export default async function CafeSettingsLayout({
  children,
  params,
}: SettingsLayoutProps) {
  const { cafeId } = await params;
  const { role } = await requireCafeAccess(cafeId);
  const canEdit = canEditCafeSettings(role);

  return (
    <div className="flex w-full flex-col gap-8 md:flex-row">
      <aside className="md:w-48 md:shrink-0">
        <p className="text-muted-foreground text-xs uppercase tracking-[0.18em]">
          Settings
        </p>
        <p className="mt-1 text-sm">
          {canEdit ? "Update how your cafe appears." : "View cafe details."}
        </p>
        <nav className="mt-4 flex flex-wrap gap-2 md:flex-col" aria-label="Cafe settings">
          {NAV.map((item) => (
            <Link
              key={item.segment}
              href={`/dashboard/cafes/${cafeId}/settings/${item.segment}`}
              className={cn("hover:bg-accent min-h-11 rounded-md px-3 py-2.5 text-sm")}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href={`/dashboard/cafes/${cafeId}/team`}
            className="hover:bg-accent min-h-11 rounded-md px-3 py-2.5 text-sm"
          >
            Team
          </Link>
        </nav>
        {!canEdit ? (
          <p className="text-muted-foreground mt-4 text-xs">
            Your account can view settings but not change them.
          </p>
        ) : null}
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
