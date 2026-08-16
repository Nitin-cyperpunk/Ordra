"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

type CafeNavProps = {
  cafeId: string;
};

const NAV = [
  { segment: "", label: "Home", match: "exact" as const },
  { segment: "orders", label: "Orders", match: "prefix" as const },
  { segment: "menu", label: "Menu", match: "prefix" as const },
  { segment: "tables", label: "Tables", match: "prefix" as const },
  { segment: "insights", label: "Insights", match: "prefix" as const, soon: true },
  { segment: "settings", label: "Settings", match: "prefix" as const },
] as const;

export function CafeNav({ cafeId }: CafeNavProps) {
  const pathname = usePathname();
  const base = `/dashboard/cafes/${cafeId}`;

  return (
    <nav aria-label="Cafe" className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 sm:pb-0">
      {NAV.map((item) => {
        const href = item.segment ? `${base}/${item.segment}` : base;
        const active =
          item.match === "exact"
            ? pathname === base || pathname === `${base}/`
            : pathname === href || pathname.startsWith(`${href}/`);

        return (
          <Link
            key={item.label}
            href={item.segment === "settings" ? `${base}/settings/profile` : href}
            className={cn(
              "inline-flex min-h-11 shrink-0 items-center rounded-md px-3 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
            aria-current={active ? "page" : undefined}
          >
            {item.label}
            {"soon" in item && item.soon ? (
              <span className="ml-1.5 text-[10px] font-normal uppercase tracking-wide opacity-70">
                Soon
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
