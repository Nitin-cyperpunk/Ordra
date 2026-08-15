import { getCafeById } from "@/features/cafes/actions";
import { requireCafeAccess } from "@/features/memberships/access";
import { listCafeTableSections, listCafeTables } from "@/features/tables/actions";
import { AddTableForm } from "@/features/tables/components/add-table-form";
import { BulkCreateTablesForm } from "@/features/tables/components/bulk-create-tables-form";
import { SectionsPanel } from "@/features/tables/components/sections-panel";
import { TablesFilters, TablesList } from "@/features/tables/components/tables-list";
import { canManageTables, type CafeTableStatus } from "@/features/tables/types";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { QrCode } from "lucide-react";

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
  const { role } = await requireCafeAccess(cafeId);
  const manage = canManageTables(role);

  const q = filters.q?.trim() ?? "";
  const status = parseStatus(filters.status);
  const sectionId = filters.section?.trim() || "all";
  const hasFilters = Boolean(q) || status !== "all" || sectionId !== "all";

  const [allTables, tables, sections] = await Promise.all([
    listCafeTables(cafeId),
    listCafeTables(cafeId, {
      q: q || undefined,
      status,
      sectionId: sectionId as "all" | "none" | string,
    }),
    listCafeTableSections(cafeId),
  ]);

  const isTrulyEmpty = allTables.length === 0;

  return (
    <main className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">Tables</h2>
          <p className="text-muted-foreground text-sm">
            Add tables, then download a QR for each so guests open your menu with table
            context.
          </p>
        </div>
        <Button asChild variant="outline" className="min-h-11 shrink-0">
          <Link href={`/dashboard/cafes/${cafeId}/tables/qr`}>
            <QrCode className="size-4" aria-hidden />
            Cafe QR
          </Link>
        </Button>
      </div>

      {isTrulyEmpty ? (
        <EmptyState
          title="No tables yet"
          description="Add your cafe tables so you can start managing them. You can create them one by one or add several at once."
        >
          {manage ? null : (
            <p className="text-muted-foreground text-sm">
              Ask an owner or manager to add tables.
            </p>
          )}
        </EmptyState>
      ) : (
        <>
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
            filteredEmpty={hasFilters && tables.length === 0}
          />
        </>
      )}

      {manage ? (
        <div className="space-y-4">
          <div id="add-table">
            <AddTableForm cafeId={cafeId} sections={sections} />
          </div>
          <details className="rounded-lg border p-4">
            <summary className="cursor-pointer text-sm font-medium">
              Add several tables at once
            </summary>
            <div className="mt-4">
              <BulkCreateTablesForm cafeId={cafeId} sections={sections} />
            </div>
          </details>
          <details className="rounded-lg border p-4">
            <summary className="cursor-pointer text-sm font-medium">
              Sections (Indoor, Outdoor…)
            </summary>
            <div className="mt-4">
              <SectionsPanel cafeId={cafeId} sections={sections} canManage={manage} />
            </div>
          </details>
        </div>
      ) : !isTrulyEmpty ? (
        <p className="text-muted-foreground text-sm">
          You can view tables. Only owners and managers can add or edit them.
        </p>
      ) : null}
    </main>
  );
}
