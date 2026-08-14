"use client";

import { useActionState } from "react";

import {
  createSectionAction,
  deleteSectionAction,
  type TableActionState,
} from "@/features/tables/actions";
import type { CafeTableSection } from "@/features/tables/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: TableActionState = {};

type SectionsPanelProps = {
  cafeId: string;
  sections: CafeTableSection[];
  canManage: boolean;
};

export function SectionsPanel({ cafeId, sections, canManage }: SectionsPanelProps) {
  const [createState, createAction, createPending] = useActionState(
    createSectionAction,
    initialState,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteSectionAction,
    initialState,
  );

  return (
    <section className="space-y-4 rounded-lg border p-4">
      <div>
        <h2 className="text-lg font-medium">Sections</h2>
        <p className="text-muted-foreground text-sm">
          Optional areas such as Indoor, Outdoor, or Terrace.
        </p>
      </div>

      {sections.length === 0 ? (
        <p className="text-muted-foreground text-sm">No sections yet.</p>
      ) : (
        <ul className="divide-y rounded-md border">
          {sections.map((section) => (
            <li
              key={section.id}
              className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
            >
              <span>{section.name}</span>
              {canManage ? (
                <form
                  action={deleteAction}
                  onSubmit={(event) => {
                    if (
                      !window.confirm(
                        `Delete section “${section.name}”? Tables keep their data; section is cleared.`,
                      )
                    ) {
                      event.preventDefault();
                    }
                  }}
                >
                  <input type="hidden" name="cafeId" value={cafeId} />
                  <input type="hidden" name="id" value={section.id} />
                  <Button
                    type="submit"
                    size="sm"
                    variant="ghost"
                    disabled={deletePending}
                    className="text-destructive"
                  >
                    Delete
                  </Button>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {deleteState.error ? (
        <p className="text-destructive text-sm">{deleteState.error}</p>
      ) : null}
      {deleteState.success ? (
        <p className="text-sm text-emerald-700">{deleteState.success}</p>
      ) : null}

      {canManage ? (
        <form
          action={createAction}
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <input type="hidden" name="cafeId" value={cafeId} />
          <div className="w-full space-y-2 sm:max-w-xs">
            <Label htmlFor="section-name">New section</Label>
            <Input
              id="section-name"
              name="name"
              placeholder="Indoor"
              required
              disabled={createPending}
              maxLength={64}
            />
          </div>
          <Button type="submit" size="sm" disabled={createPending}>
            {createPending ? "Adding…" : "Add section"}
          </Button>
        </form>
      ) : null}

      {createState.error ? (
        <p className="text-destructive text-sm">{createState.error}</p>
      ) : null}
      {createState.success ? (
        <p className="text-sm text-emerald-700">{createState.success}</p>
      ) : null}
      {createState.fieldErrors?.name?.[0] ? (
        <p className="text-destructive text-sm">{createState.fieldErrors.name[0]}</p>
      ) : null}
    </section>
  );
}
