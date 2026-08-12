import Link from "next/link";
import type { ReactNode } from "react";

import { requireCafeAccess } from "@/features/memberships/access";
import { canEditCafeSettings } from "@/features/memberships/types";

type SettingsLayoutProps = {
  children: ReactNode;
  params: Promise<{ cafeId: string }>;
};

const NAV = [
  { segment: "profile", label: "Profile" },
  { segment: "business", label: "Business" },
  { segment: "hours", label: "Opening hours" },
] as const;

export default async function CafeSettingsLayout({
  children,
  params,
}: SettingsLayoutProps) {
  const { cafeId } = await params;
  const { cafe, role } = await requireCafeAccess(cafeId);
  const canEdit = canEditCafeSettings(role);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 md:flex-row">
      <aside className="md:w-48 md:shrink-0">
        <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">
          Settings
        </p>
        <h1 className="mt-1 text-lg font-semibold tracking-tight">{cafe.name}</h1>
        <nav className="mt-4 flex flex-wrap gap-2 md:flex-col" aria-label="Cafe settings">
          {NAV.map((item) => (
            <Link
              key={item.segment}
              href={`/dashboard/cafes/${cafeId}/settings/${item.segment}`}
              className="hover:bg-accent rounded-md px-3 py-2 text-sm"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href={`/dashboard/cafes/${cafeId}/team`}
            className="hover:bg-accent rounded-md px-3 py-2 text-sm"
          >
            Team
          </Link>
          <Link
            href={`/dashboard/cafes/${cafeId}`}
            className="text-muted-foreground hover:bg-accent rounded-md px-3 py-2 text-sm"
          >
            ← Cafe workspace
          </Link>
        </nav>
        {!canEdit ? (
          <p className="text-muted-foreground mt-4 text-xs">
            Your role ({role}) is read-only for cafe settings.
          </p>
        ) : null}
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
