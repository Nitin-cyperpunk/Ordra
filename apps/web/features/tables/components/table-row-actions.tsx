"use client";

import Link from "next/link";
import { useActionState, useEffect, useId, useRef, useState } from "react";
import { Pencil, QrCode, X } from "lucide-react";

import {
  deleteTableAction,
  setTableStatusAction,
  updateTableAction,
  type TableActionState,
} from "@/features/tables/actions";
import type { CafeTable, CafeTableSection } from "@/features/tables/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const initialState: TableActionState = {};

type TableRowActionsProps = {
  cafeId: string;
  table: CafeTable;
  sections: CafeTableSection[];
  canManage: boolean;
};

export function TableRowActions({
  cafeId,
  table,
  sections,
  canManage,
}: TableRowActionsProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [message, setMessage] = useState<string | null>(null);

  const [updateState, updateAction, updatePending] = useActionState(
    updateTableAction,
    initialState,
  );
  const [statusState, statusAction, statusPending] = useActionState(
    setTableStatusAction,
    initialState,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteTableAction,
    initialState,
  );

  useEffect(() => {
    const next =
      updateState.success ??
      statusState.success ??
      deleteState.success ??
      updateState.error ??
      statusState.error ??
      deleteState.error ??
      null;
    setMessage(next);
    if (updateState.success || deleteState.success) {
      dialogRef.current?.close();
    }
  }, [updateState, statusState, deleteState]);

  const qrHref = `/dashboard/cafes/${cafeId}/tables/${table.id}/qr`;

  if (!canManage) {
    return (
      <div className="flex flex-wrap items-center justify-end gap-1">
        <Button asChild size="sm" variant="outline">
          <Link href={qrHref} aria-label={`QR for table ${table.code}`}>
            <QrCode className="size-3.5" aria-hidden />
            QR
          </Link>
        </Button>
        <span className="text-muted-foreground text-xs">View only</span>
      </div>
    );
  }

  const pending = updatePending || statusPending || deletePending;
  const nextStatus = table.status === "active" ? "inactive" : "active";

  return (
    <div className="flex flex-wrap items-center justify-end gap-1">
      {message && !dialogRef.current?.open ? (
        <span className="text-muted-foreground sr-only">{message}</span>
      ) : null}

      <Button asChild size="sm" variant="outline">
        <Link href={qrHref} aria-label={`QR for table ${table.code}`}>
          <QrCode className="size-3.5" aria-hidden />
          QR
        </Link>
      </Button>

      <form action={statusAction}>
        <input type="hidden" name="cafeId" value={cafeId} />
        <input type="hidden" name="id" value={table.id} />
        <input type="hidden" name="status" value={nextStatus} />
        <Button type="submit" size="sm" variant="outline" disabled={pending}>
          {table.status === "active" ? "Deactivate" : "Activate"}
        </Button>
      </form>

      <Button
        type="button"
        size="sm"
        variant="ghost"
        disabled={pending}
        aria-label={`Edit ${table.code}`}
        onClick={() => dialogRef.current?.showModal()}
      >
        <Pencil className="size-3.5" />
        <span className="sr-only sm:not-sr-only">Edit</span>
      </Button>

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        className={cn(
          "bg-background fixed left-1/2 top-1/2 z-50 m-0 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border p-0 shadow-lg",
          "[&::backdrop]:bg-black/50",
        )}
        onClose={() => setMessage(null)}
      >
        <div className="space-y-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <h3 id={titleId} className="text-base font-semibold">
              Edit {table.code}
            </h3>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => dialogRef.current?.close()}
              aria-label="Close"
            >
              <X className="size-4" />
            </Button>
          </div>

          <form action={updateAction} className="space-y-3">
            <input type="hidden" name="cafeId" value={cafeId} />
            <input type="hidden" name="id" value={table.id} />

            <div className="space-y-2">
              <Label htmlFor={`edit-code-${table.id}`}>Table number</Label>
              <Input
                id={`edit-code-${table.id}`}
                name="code"
                defaultValue={table.code}
                required
                disabled={pending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`edit-capacity-${table.id}`}>Capacity</Label>
              <Input
                id={`edit-capacity-${table.id}`}
                name="capacity"
                type="number"
                min={1}
                max={99}
                defaultValue={table.capacity}
                required
                disabled={pending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`edit-section-${table.id}`}>Section</Label>
              <select
                id={`edit-section-${table.id}`}
                name="sectionId"
                defaultValue={table.section_id ?? ""}
                disabled={pending}
                className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm"
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
              <Label htmlFor={`edit-status-${table.id}`}>Status</Label>
              <select
                id={`edit-status-${table.id}`}
                name="status"
                defaultValue={table.status}
                disabled={pending}
                className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {updateState.error ? (
              <p className="text-destructive text-sm">{updateState.error}</p>
            ) : null}
            {updateState.success ? (
              <p className="text-success-foreground text-sm">{updateState.success}</p>
            ) : null}

            <Button type="submit" size="sm" disabled={pending}>
              {updatePending ? "Saving…" : "Save changes"}
            </Button>
          </form>

          <div className="border-t pt-4">
            <p className="text-muted-foreground mb-2 text-xs">
              Prefer deactivate when possible. Hard delete is for setup mistakes only —
              future bookings/orders will block this.
            </p>
            <form
              action={deleteAction}
              onSubmit={(event) => {
                if (
                  !window.confirm(
                    `Delete table ${table.code}? Prefer deactivate if this table may be referenced later.`,
                  )
                ) {
                  event.preventDefault();
                }
              }}
            >
              <input type="hidden" name="cafeId" value={cafeId} />
              <input type="hidden" name="id" value={table.id} />
              <Button type="submit" size="sm" variant="destructive" disabled={pending}>
                {deletePending ? "Deleting…" : "Delete table"}
              </Button>
            </form>
            {deleteState.error ? (
              <p className="text-destructive mt-2 text-sm">{deleteState.error}</p>
            ) : null}
          </div>
        </div>
      </dialog>
    </div>
  );
}
