"use client";

import { useActionState, useState } from "react";

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
  const [showMore, setShowMore] = useState(false);

  return (
    <form action={formAction} className="space-y-4 rounded-xl border p-4 sm:p-5">
      <div>
        <h3 className="text-base font-semibold tracking-tight">Add a table</h3>
        <p className="text-muted-foreground text-sm">
          Give it a number and how many people it seats.
        </p>
      </div>

      <input type="hidden" name="cafeId" value={cafeId} />
      <input type="hidden" name="status" value="active" />
      {!showMore || sections.length === 0 ? (
        <input type="hidden" name="sectionId" value="" />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="code">Table number</Label>
          <Input
            id="code"
            name="code"
            placeholder="T01"
            required
            disabled={pending}
            className="min-h-11"
            aria-invalid={Boolean(state.fieldErrors?.code)}
          />
          {state.fieldErrors?.code?.[0] ? (
            <p className="text-destructive text-sm">{state.fieldErrors.code[0]}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="capacity">Seats</Label>
          <Input
            id="capacity"
            name="capacity"
            type="number"
            min={1}
            max={99}
            defaultValue={4}
            required
            disabled={pending}
            className="min-h-11"
            aria-invalid={Boolean(state.fieldErrors?.capacity)}
          />
          {state.fieldErrors?.capacity?.[0] ? (
            <p className="text-destructive text-sm">{state.fieldErrors.capacity[0]}</p>
          ) : null}
        </div>
      </div>

      {sections.length > 0 ? (
        <>
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline"
            onClick={() => setShowMore((value) => !value)}
          >
            {showMore ? "Hide extra options" : "More options"}
          </button>
          {showMore ? (
            <div className="space-y-2">
              <Label htmlFor="sectionId">Section</Label>
              <select
                id="sectionId"
                name="sectionId"
                disabled={pending}
                className="border-input bg-background flex min-h-11 w-full rounded-md border px-3 py-2 text-sm shadow-sm"
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
          ) : null}
        </>
      ) : null}

      {state.error ? (
        <p className="text-destructive text-sm" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="text-success-foreground text-sm" role="status">
          {state.success}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="min-h-11 w-full sm:w-auto">
        {pending ? "Saving…" : "Create table"}
      </Button>
    </form>
  );
}
