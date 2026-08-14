import Link from "next/link";

import type { CafeTable, CafeTableSection } from "@/features/tables/types";
import { TableRowActions } from "@/features/tables/components/table-row-actions";
import { cn } from "@/lib/utils";

type TablesListProps = {
  cafeId: string;
  tables: CafeTable[];
  sections: CafeTableSection[];
  canManage: boolean;
};

function StatusBadge({ status }: { status: "active" | "inactive" }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize",
        status === "active"
          ? "bg-emerald-500/10 text-emerald-700"
          : "bg-muted text-muted-foreground",
      )}
    >
      {status}
    </span>
  );
}

export function TablesList({ cafeId, tables, sections, canManage }: TablesListProps) {
  if (tables.length === 0) {
    return (
      <p className="text-muted-foreground rounded-lg border border-dashed p-6 text-center text-sm">
        No tables match these filters.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full min-w-[36rem] text-left text-sm">
        <thead className="bg-muted/40 text-muted-foreground border-b text-xs uppercase tracking-wide">
          <tr>
            <th className="px-3 py-2 font-medium">Table</th>
            <th className="px-3 py-2 font-medium">Capacity</th>
            <th className="px-3 py-2 font-medium">Section</th>
            <th className="px-3 py-2 font-medium">Status</th>
            <th className="px-3 py-2 font-medium">Created</th>
            <th className="px-3 py-2 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {tables.map((table) => (
            <tr key={table.id} className="hover:bg-muted/20">
              <td className="px-3 py-2.5 font-medium">{table.code}</td>
              <td className="px-3 py-2.5">{table.capacity}</td>
              <td className="text-muted-foreground px-3 py-2.5">
                {table.section?.name ?? "—"}
              </td>
              <td className="px-3 py-2.5">
                <StatusBadge status={table.status} />
              </td>
              <td className="text-muted-foreground px-3 py-2.5">
                {new Date(table.created_at).toLocaleDateString()}
              </td>
              <td className="px-3 py-2.5">
                <TableRowActions
                  cafeId={cafeId}
                  table={table}
                  sections={sections}
                  canManage={canManage}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type TablesFiltersProps = {
  cafeId: string;
  sections: CafeTableSection[];
  q: string;
  status: string;
  sectionId: string;
};

export function TablesFilters({
  cafeId,
  sections,
  q,
  status,
  sectionId,
}: TablesFiltersProps) {
  return (
    <form
      method="get"
      action={`/dashboard/cafes/${cafeId}/tables`}
      className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:flex-wrap sm:items-end"
    >
      <div className="space-y-1 sm:min-w-[10rem] sm:flex-1">
        <label htmlFor="q" className="text-muted-foreground text-xs font-medium">
          Search
        </label>
        <input
          id="q"
          name="q"
          defaultValue={q}
          placeholder="T01"
          className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm"
        />
      </div>

      <div className="space-y-1 sm:w-36">
        <label htmlFor="status" className="text-muted-foreground text-xs font-medium">
          Status
        </label>
        <select
          id="status"
          name="status"
          defaultValue={status}
          className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm"
        >
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="space-y-1 sm:w-44">
        <label htmlFor="section" className="text-muted-foreground text-xs font-medium">
          Section
        </label>
        <select
          id="section"
          name="section"
          defaultValue={sectionId}
          className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm"
        >
          <option value="all">All sections</option>
          <option value="none">No section</option>
          {sections.map((section) => (
            <option key={section.id} value={section.id}>
              {section.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          className="bg-primary text-primary-foreground inline-flex h-9 items-center rounded-md px-3 text-sm font-medium"
        >
          Filter
        </button>
        <Link
          href={`/dashboard/cafes/${cafeId}/tables`}
          className="border-input bg-background inline-flex h-9 items-center rounded-md border px-3 text-sm"
        >
          Reset
        </Link>
      </div>
    </form>
  );
}
