import Link from "next/link";

import { getCafeById } from "@/features/cafes/actions";
import { requireCafeAccess } from "@/features/memberships/access";
import { SyncActiveCafe } from "@/features/memberships/components/sync-active-cafe";
import { listCafeTableSections, listCafeTables } from "@/features/tables/actions";
import { AddTableForm } from "@/features/tables/components/add-table-form";
import { BulkCreateTablesForm } from "@/features/tables/components/bulk-create-tables-form";
import { SectionsPanel } from "@/features/tables/components/sections-panel";
import { TablesFilters, TablesList } from "@/features/tables/components/tables-list";
import { canManageTables, type CafeTableStatus } from "@/features/tables/types";
import { Button } from "@/components/ui/button";

type TablesPageProps = {
  params: Promise<{ cafeId: string }>;
  searchParams: Promise<{
    q?: string;
    status?: string;
    section?: string;
  }>;
};

export async function generateMetadata({ params }: TablesPageProps) {
  const { cafeId } = await params;
  const cafe = await getCafeById(cafeId);
  return {
    title: cafe ? `Tables · ${cafe.name}` : "Tables · Ordra",
    robots: { index: false, follow: false },
  };
}

function parseStatus(value: string | undefined): CafeTableStatus | "all" {
  if (value === "active" || value === "inactive") return value;
  return "all";
}

export default async function CafeTablesPage({ params, searchParams }: TablesPageProps) {
  const { cafeId } = await params;
  const filters = await searchParams;
  const { cafe, role } = await requireCafeAccess(cafeId);
  const manage = canManageTables(role);

  const q = filters.q?.trim() ?? "";
  const status = parseStatus(filters.status);
  const sectionId = filters.section?.trim() || "all";

  const [tables, sections] = await Promise.all([
    listCafeTables(cafeId, {
      q: q || undefined,
      status,
      sectionId: sectionId as "all" | "none" | string,
    }),
    listCafeTableSections(cafeId),
  ]);

  return (
    <main className="mx-auto max-w-4xl space-y-8">
      <SyncActiveCafe cafeId={cafeId} />

      <div className="space-y-2">
        <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">
          Cafe workspace · Tables
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">{cafe.name}</h1>
        <p className="text-muted-foreground text-sm">
          Configure physical tables for this cafe. Booking, QR ordering, and occupancy
          come later.
        </p>
        <p className="text-muted-foreground text-sm">
          Your role: <span className="text-foreground capitalize">{role}</span>
          {" · "}
          {tables.length} shown
        </p>
      </div>

      <TablesFilters
        cafeId={cafeId}
        sections={sections}
        q={q}
        status={status}
        sectionId={sectionId}
      />

      <TablesList
        cafeId={cafeId}
        tables={tables}
        sections={sections}
        canManage={manage}
      />

      {manage ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <AddTableForm cafeId={cafeId} sections={sections} />
          <BulkCreateTablesForm cafeId={cafeId} sections={sections} />
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">
          Only owners and managers can add or edit tables. You can still view the floor
          list.
        </p>
      )}

      <SectionsPanel cafeId={cafeId} sections={sections} canManage={manage} />

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href={`/dashboard/cafes/${cafeId}`}>Cafe workspace</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard">All cafes</Link>
        </Button>
      </div>
    </main>
  );
}
