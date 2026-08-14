"use client";

import { useActionState } from "react";

import { createTableAction, type TableActionState } from "@/features/tables/actions";
import type { CafeTableSection } from "@/features/tables/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: TableActionState = {};

type AddTableFormProps = {
  cafeId: string;
  sections: CafeTableSection[];
};

export function AddTableForm({ cafeId, sections }: AddTableFormProps) {
  const [state, formAction, pending] = useActionState(createTableAction, initialState);

  return (
    <form action={formAction} className="space-y-4 rounded-lg border p-4">
      <div>
        <h3 className="text-sm font-medium">Add table</h3>
        <p className="text-muted-foreground text-xs">
          Identifier is unique within this cafe (e.g. T01, VIP-01).
        </p>
      </div>

      <input type="hidden" name="cafeId" value={cafeId} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="code">Table number</Label>
          <Input
            id="code"
            name="code"
            placeholder="T01"
            required
            disabled={pending}
            aria-invalid={Boolean(state.fieldErrors?.code)}
          />
          {state.fieldErrors?.code?.[0] ? (
            <p className="text-destructive text-sm">{state.fieldErrors.code[0]}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="capacity">Capacity</Label>
          <Input
            id="capacity"
            name="capacity"
            type="number"
            min={1}
            max={99}
            defaultValue={4}
            required
            disabled={pending}
            aria-invalid={Boolean(state.fieldErrors?.capacity)}
          />
          {state.fieldErrors?.capacity?.[0] ? (
            <p className="text-destructive text-sm">{state.fieldErrors.capacity[0]}</p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="sectionId">Section</Label>
          <select
            id="sectionId"
            name="sectionId"
            disabled={pending}
            className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm"
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

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            name="status"
            disabled={pending}
            className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm"
            defaultValue="active"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {state.error ? <p className="text-destructive text-sm">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-700">{state.success}</p> : null}

      <Button type="submit" disabled={pending} size="sm">
        {pending ? "Adding…" : "Add table"}
      </Button>
    </form>
  );
}
