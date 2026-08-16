"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";

import {
  commitMenuImportAction,
  retryMenuImportAction,
} from "@/features/menu-import/actions";
import { mapMenuImportError } from "@/features/menu-import/errors";
import type {
  ExtractedMenuDraft,
  ExtractedMenuItem,
  MenuImportRecord,
} from "@/features/menu-import/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { randomId } from "@/features/menu-import/client-id";

type MenuImportReviewProps = {
  cafeId: string;
  record: MenuImportRecord;
  existingItemNames: string[];
};

function countSelected(draft: ExtractedMenuDraft): number {
  return draft.categories.reduce(
    (sum, category) => sum + category.items.filter((item) => item.selected).length,
    0,
  );
}

function findInternalDuplicates(draft: ExtractedMenuDraft): Set<string> {
  const seen = new Map<string, number>();
  const dupes = new Set<string>();
  for (const category of draft.categories) {
    for (const item of category.items) {
      const key = item.name.trim().toLowerCase();
      const count = (seen.get(key) ?? 0) + 1;
      seen.set(key, count);
      if (count > 1) dupes.add(key);
    }
  }
  return dupes;
}

export function MenuImportReview({
  cafeId,
  record,
  existingItemNames,
}: MenuImportReviewProps) {
  const existing = useMemo(
    () => new Set(existingItemNames.map((name) => name.trim().toLowerCase())),
    [existingItemNames],
  );

  const [draft, setDraft] = useState<ExtractedMenuDraft>(
    record.extracted_payload ?? { categories: [], warnings: [] },
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [retryPending, startRetry] = useTransition();

  const selectedCount = countSelected(draft);
  const attentionCount = draft.categories.reduce(
    (sum, category) =>
      sum +
      category.items.filter((item) => item.needsAttention || item.price === null).length,
    0,
  );
  const internalDupes = findInternalDuplicates(draft);

  if (record.status === "failed") {
    return (
      <div className="space-y-4 rounded-xl border p-6 text-center">
        <h3 className="text-lg font-semibold">
          {mapMenuImportError(record.error_code ?? "MENU_IMPORT_PROVIDER_FAILED")}
        </h3>
        <p className="text-muted-foreground text-sm">
          Try another file, or add items manually from the menu page.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <form
            action={() => {
              startRetry(async () => {
                const form = new FormData();
                form.set("cafeId", cafeId);
                form.set("importId", record.id);
                await retryMenuImportAction({}, form);
              });
            }}
          >
            <Button type="submit" disabled={retryPending} className="min-h-11">
              {retryPending ? "Trying again…" : "Try again"}
            </Button>
          </form>
          <Button asChild variant="outline" className="min-h-11">
            <Link href={`/dashboard/cafes/${cafeId}/menu/import`}>Try another file</Link>
          </Button>
          <Button asChild variant="ghost" className="min-h-11">
            <Link href={`/dashboard/cafes/${cafeId}/menu`}>Add items manually</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (record.status === "processing" || record.status === "uploaded") {
    return (
      <div className="space-y-2 rounded-xl border p-8 text-center" aria-live="polite">
        <p className="font-medium">Your menu is being prepared…</p>
        <p className="text-muted-foreground text-sm">
          Reading your menu and organizing items.
        </p>
      </div>
    );
  }

  if (record.status === "completed") {
    return (
      <div className="space-y-3 rounded-xl border p-6 text-center">
        <p className="font-medium">This import is already complete.</p>
        <Button asChild className="min-h-11">
          <Link href={`/dashboard/cafes/${cafeId}/menu`}>Back to menu</Link>
        </Button>
      </div>
    );
  }

  function updateItem(localId: string, patch: Partial<ExtractedMenuItem>) {
    setDraft((prev) => ({
      ...prev,
      categories: prev.categories.map((category) => ({
        ...category,
        items: category.items.map((item) =>
          item.localId === localId
            ? {
                ...item,
                ...patch,
                needsAttention:
                  patch.price === null
                    ? true
                    : patch.price !== undefined
                      ? false
                      : item.needsAttention,
                attentionReason:
                  patch.price === null
                    ? "Price couldn’t be detected"
                    : patch.price !== undefined
                      ? null
                      : item.attentionReason,
              }
            : item,
        ),
      })),
    }));
  }

  function removeItem(localId: string) {
    setDraft((prev) => ({
      ...prev,
      categories: prev.categories
        .map((category) => ({
          ...category,
          items: category.items.filter((item) => item.localId !== localId),
        }))
        .filter((category) => category.items.length > 0),
    }));
  }

  function renameCategory(localId: string, name: string) {
    setDraft((prev) => ({
      ...prev,
      categories: prev.categories.map((category) =>
        category.localId === localId ? { ...category, name } : category,
      ),
    }));
  }

  function addBlankItem(categoryLocalId: string) {
    const item: ExtractedMenuItem = {
      localId: randomId(),
      name: "New item",
      description: null,
      price: null,
      diet: null,
      selected: true,
      needsAttention: true,
      attentionReason: "Price couldn’t be detected",
    };
    setDraft((prev) => ({
      ...prev,
      categories: prev.categories.map((category) =>
        category.localId === categoryLocalId
          ? { ...category, items: [...category.items, item] }
          : category,
      ),
    }));
    setEditingId(item.localId);
  }

  function addCategory() {
    const localId = randomId();
    setDraft((prev) => ({
      ...prev,
      categories: [...prev.categories, { localId, name: "New category", items: [] }],
    }));
  }

  function onImport() {
    setError(null);
    startTransition(async () => {
      const form = new FormData();
      form.set("cafeId", cafeId);
      form.set("importId", record.id);
      form.set("draft", JSON.stringify(draft));
      const result = await commitMenuImportAction({}, form);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-xl font-semibold tracking-tight">
          We found {selectedCount} items
        </h3>
        <p className="text-muted-foreground text-sm">
          Review your menu before adding it.
          {attentionCount > 0 ? ` ${attentionCount} need your attention.` : ""}
        </p>
      </div>

      {draft.warnings.length > 0 ? (
        <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-sm">
          {draft.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      ) : null}

      <div className="space-y-6">
        {draft.categories.map((category) => (
          <section key={category.localId} className="space-y-3">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-1">
                <Label htmlFor={`cat-${category.localId}`} className="text-xs">
                  Category
                </Label>
                <Input
                  id={`cat-${category.localId}`}
                  value={category.name}
                  disabled={pending}
                  className="min-h-11 font-semibold"
                  onChange={(event) =>
                    renameCategory(category.localId, event.target.value)
                  }
                />
              </div>
              <p className="text-muted-foreground text-xs">
                {category.items.length} items
              </p>
            </div>
            <ul className="space-y-2">
              {category.items.map((item) => {
                const key = item.name.trim().toLowerCase();
                const isDupe = internalDupes.has(key);
                const exists = existing.has(key);
                const editing = editingId === item.localId;

                return (
                  <li
                    key={item.localId}
                    className={cn(
                      "rounded-xl border p-3",
                      (item.needsAttention || item.price === null) &&
                        "bg-warning-muted/40 border-amber-500/40",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        className="mt-1 size-4"
                        checked={item.selected}
                        aria-label={`Include ${item.name}`}
                        disabled={pending}
                        onChange={(event) =>
                          updateItem(item.localId, { selected: event.target.checked })
                        }
                      />
                      <div className="min-w-0 flex-1 space-y-2">
                        {editing ? (
                          <div className="grid gap-2 sm:grid-cols-2">
                            <div className="space-y-1">
                              <Label htmlFor={`name-${item.localId}`}>Name</Label>
                              <Input
                                id={`name-${item.localId}`}
                                value={item.name}
                                onChange={(event) =>
                                  updateItem(item.localId, { name: event.target.value })
                                }
                              />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor={`price-${item.localId}`}>Price</Label>
                              <Input
                                id={`price-${item.localId}`}
                                inputMode="decimal"
                                value={item.price ?? ""}
                                placeholder="149"
                                onChange={(event) => {
                                  const raw = event.target.value.trim();
                                  if (!raw) {
                                    updateItem(item.localId, { price: null });
                                    return;
                                  }
                                  const value = Number.parseFloat(raw);
                                  updateItem(item.localId, {
                                    price: Number.isFinite(value) ? value : null,
                                  });
                                }}
                              />
                            </div>
                            <div className="space-y-1 sm:col-span-2">
                              <Label htmlFor={`desc-${item.localId}`}>Description</Label>
                              <Input
                                id={`desc-${item.localId}`}
                                value={item.description ?? ""}
                                onChange={(event) =>
                                  updateItem(item.localId, {
                                    description: event.target.value || null,
                                  })
                                }
                              />
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => setEditingId(null)}
                            >
                              Done
                            </Button>
                          </div>
                        ) : (
                          <>
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div>
                                <p className="font-medium">{item.name}</p>
                                {item.description ? (
                                  <p className="text-muted-foreground text-sm">
                                    {item.description}
                                  </p>
                                ) : null}
                              </div>
                              <p className="text-sm font-semibold tabular-nums">
                                {item.price != null ? `₹${item.price}` : "₹?"}
                              </p>
                            </div>
                            {item.price == null ? (
                              <p className="text-warning-foreground text-xs">
                                Price couldn’t be detected
                              </p>
                            ) : null}
                            {isDupe ? (
                              <p className="text-muted-foreground text-xs">
                                Possible duplicate in this import
                              </p>
                            ) : null}
                            {exists ? (
                              <p className="text-muted-foreground text-xs">
                                Already exists in your menu (will be skipped)
                              </p>
                            ) : null}
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingId(item.localId)}
                              >
                                Edit
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => removeItem(item.localId)}
                              >
                                Remove
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() => addBlankItem(category.localId)}
            >
              Add item
            </Button>
          </section>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        className="min-h-11"
        disabled={pending}
        onClick={addCategory}
      >
        Add category
      </Button>

      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}

      <Button
        type="button"
        className="min-h-12 w-full"
        disabled={pending || selectedCount === 0}
        onClick={onImport}
      >
        {pending ? "Importing…" : "Import menu"}
      </Button>
    </div>
  );
}
