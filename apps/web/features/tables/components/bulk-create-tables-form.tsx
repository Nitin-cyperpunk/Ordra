"use client";

import { useActionState } from "react";

import { bulkCreateTablesAction, type TableActionState } from "@/features/tables/actions";
import type { CafeTableSection } from "@/features/tables/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: TableActionState = {};

type BulkCreateTablesFormProps = {
  cafeId: string;
  sections: CafeTableSection[];
};

export function BulkCreateTablesForm({ cafeId, sections }: BulkCreateTablesFormProps) {
  const [state, formAction, pending] = useActionState(
    bulkCreateTablesAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4 rounded-lg border p-4">
      <div>
        <h3 className="text-sm font-medium">Bulk create</h3>
        <p className="text-muted-foreground text-xs">
          Example: prefix T, start 1, count 10 → T01…T10.
        </p>
      </div>

      <input type="hidden" name="cafeId" value={cafeId} />
      <input type="hidden" name="pad" value="2" />
      <input type="hidden" name="status" value="active" />

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="bulk-prefix">Prefix</Label>
          <Input
            id="bulk-prefix"
            name="prefix"
            defaultValue="T"
            disabled={pending}
            maxLength={16}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bulk-start">Start</Label>
          <Input
            id="bulk-start"
            name="start"
            type="number"
            min={1}
            max={999}
            defaultValue={1}
            required
            disabled={pending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bulk-count">Count</Label>
          <Input
            id="bulk-count"
            name="count"
            type="number"
            min={1}
            max={50}
            defaultValue={5}
            required
            disabled={pending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bulk-capacity">Capacity</Label>
          <Input
            id="bulk-capacity"
            name="capacity"
            type="number"
            min={1}
            max={99}
            defaultValue={4}
            required
            disabled={pending}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bulk-sectionId">Section</Label>
        <select
          id="bulk-sectionId"
          name="sectionId"
          disabled={pending}
          className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm sm:max-w-xs"
          defaultValue=""
        >
          <option value="">No section</option>
          {sections.map((section) => (
            <option key={section.id} value={section.id}>
              {section.name}
            </option>
          ))}
        </select>
      </div>

      {state.error ? <p className="text-destructive text-sm">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-700">{state.success}</p> : null}

      <Button type="submit" disabled={pending} size="sm" variant="secondary">
        {pending ? "Creating…" : "Create tables"}
      </Button>
    </form>
  );
}
