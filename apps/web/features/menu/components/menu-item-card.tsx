"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { Pencil, X } from "lucide-react";

import {
  deleteItemAction,
  removeItemImageAction,
  reorderItemAction,
  setItemAvailabilityAction,
  updateItemAction,
  uploadItemImageAction,
  type MenuActionState,
} from "@/features/menu/actions";
import type { MenuCategory, MenuItem } from "@/features/menu/types";
import { dietLabel, formatMenuPrice } from "@/features/menu/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const initialState: MenuActionState = {};

type MenuItemCardProps = {
  cafeId: string;
  item: MenuItem;
  categories: MenuCategory[];
  canManage: boolean;
  imageUrl: string | null;
  currency?: string;
};

export function MenuItemCard({
  cafeId,
  item,
  categories,
  canManage,
  imageUrl,
  currency = "INR",
}: MenuItemCardProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [banner, setBanner] = useState<string | null>(null);

  const [updateState, updateAction, updatePending] = useActionState(
    updateItemAction,
    initialState,
  );
  const [availabilityState, availabilityAction, availabilityPending] = useActionState(
    setItemAvailabilityAction,
    initialState,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteItemAction,
    initialState,
  );
  const [uploadState, uploadAction, uploadPending] = useActionState(
    uploadItemImageAction,
    initialState,
  );
  const [removeImageState, removeImageAction, removeImagePending] = useActionState(
    removeItemImageAction,
    initialState,
  );
  const [, reorderAction, reorderPending] = useActionState(
    reorderItemAction,
    initialState,
  );

  useEffect(() => {
    const next =
      updateState.success ??
      availabilityState.success ??
      deleteState.success ??
      uploadState.success ??
      removeImageState.success ??
      updateState.error ??
      availabilityState.error ??
      deleteState.error ??
      uploadState.error ??
      removeImageState.error ??
      null;
    setBanner(next);
    if (updateState.success || deleteState.success) {
      dialogRef.current?.close();
    }
  }, [updateState, availabilityState, deleteState, uploadState, removeImageState]);

  const pending =
    updatePending ||
    availabilityPending ||
    deletePending ||
    uploadPending ||
    removeImagePending ||
    reorderPending;

  return (
    <article className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-start">
      <div className="bg-muted relative h-24 w-full shrink-0 overflow-hidden rounded-md sm:h-24 sm:w-24">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="text-muted-foreground flex h-full items-center justify-center text-xs">
            No image
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="text-base font-semibold tracking-tight">{item.name}</h3>
          <p className="text-sm font-medium">{formatMenuPrice(item.price, currency)}</p>
        </div>
        {item.description ? (
          <p className="text-muted-foreground line-clamp-2 text-sm">{item.description}</p>
        ) : null}
        <p className="text-muted-foreground text-xs">
          {item.category?.name ?? "Uncategorized"}
          {" · "}
          {dietLabel(item.diet)}
          {" · "}
          <span className={item.is_available ? "text-success-foreground" : ""}>
            {item.is_available ? "Available" : "Unavailable"}
          </span>
        </p>
        {banner ? <p className="text-muted-foreground text-xs">{banner}</p> : null}
      </div>

      {canManage ? (
        <div className="flex flex-wrap gap-1 sm:flex-col sm:items-stretch">
          <form action={availabilityAction}>
            <input type="hidden" name="cafeId" value={cafeId} />
            <input type="hidden" name="id" value={item.id} />
            <input
              type="hidden"
              name="isAvailable"
              value={item.is_available ? "false" : "true"}
            />
            <Button
              type="submit"
              size="sm"
              variant="outline"
              disabled={pending}
              className="w-full"
            >
              {item.is_available ? "Mark unavailable" : "Mark available"}
            </Button>
          </form>

          <div className="flex gap-1">
            <form action={reorderAction}>
              <input type="hidden" name="cafeId" value={cafeId} />
              <input type="hidden" name="id" value={item.id} />
              <input type="hidden" name="direction" value="up" />
              <Button type="submit" size="sm" variant="ghost" disabled={pending}>
                ↑
              </Button>
            </form>
            <form action={reorderAction}>
              <input type="hidden" name="cafeId" value={cafeId} />
              <input type="hidden" name="id" value={item.id} />
              <input type="hidden" name="direction" value="down" />
              <Button type="submit" size="sm" variant="ghost" disabled={pending}>
                ↓
              </Button>
            </form>
          </div>

          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={pending}
            onClick={() => dialogRef.current?.showModal()}
          >
            <Pencil className="size-3.5" />
            Edit
          </Button>
        </div>
      ) : null}

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        className={cn(
          "bg-background fixed left-1/2 top-1/2 z-50 m-0 max-h-[90vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border p-0 shadow-lg",
          "[&::backdrop]:bg-black/50",
        )}
      >
        <div className="space-y-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <h3 id={titleId} className="text-base font-semibold">
              Edit {item.name}
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
            <input type="hidden" name="id" value={item.id} />

            <div className="space-y-2">
              <Label htmlFor={`edit-name-${item.id}`}>Name</Label>
              <Input
                id={`edit-name-${item.id}`}
                name="name"
                defaultValue={item.name}
                required
                disabled={pending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`edit-description-${item.id}`}>Description</Label>
              <Textarea
                id={`edit-description-${item.id}`}
                name="description"
                defaultValue={item.description ?? ""}
                rows={3}
                disabled={pending}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={`edit-price-${item.id}`}>Price (₹)</Label>
                <Input
                  id={`edit-price-${item.id}`}
                  name="price"
                  defaultValue={item.price}
                  required
                  disabled={pending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`edit-category-${item.id}`}>Category</Label>
                <select
                  id={`edit-category-${item.id}`}
                  name="categoryId"
                  defaultValue={item.category_id}
                  disabled={pending}
                  className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                      {!category.is_active ? " (inactive)" : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={`edit-diet-${item.id}`}>Diet</Label>
                <select
                  id={`edit-diet-${item.id}`}
                  name="diet"
                  defaultValue={item.diet}
                  disabled={pending}
                  className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm"
                >
                  <option value="vegetarian">Vegetarian</option>
                  <option value="non_vegetarian">Non-vegetarian</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor={`edit-available-${item.id}`}>Availability</Label>
                <select
                  id={`edit-available-${item.id}`}
                  name="isAvailable"
                  defaultValue={item.is_available ? "true" : "false"}
                  disabled={pending}
                  className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm"
                >
                  <option value="true">Available</option>
                  <option value="false">Unavailable</option>
                </select>
              </div>
            </div>

            {updateState.error ? (
              <p className="text-destructive text-sm">{updateState.error}</p>
            ) : null}

            <Button type="submit" size="sm" disabled={pending}>
              {updatePending ? "Saving…" : "Save changes"}
            </Button>
          </form>

          <div className="space-y-3 border-t pt-4">
            <h4 className="text-sm font-medium">Image</h4>
            <form action={uploadAction} className="space-y-2">
              <input type="hidden" name="cafeId" value={cafeId} />
              <input type="hidden" name="itemId" value={item.id} />
              <Input
                type="file"
                name="image"
                accept="image/png,image/jpeg,image/webp"
                disabled={pending}
              />
              <p className="text-muted-foreground text-xs">
                PNG, JPEG, or WebP · max 2 MB
              </p>
              <Button type="submit" size="sm" variant="secondary" disabled={pending}>
                {uploadPending ? "Uploading…" : "Upload / replace image"}
              </Button>
            </form>
            {item.image_path ? (
              <form action={removeImageAction}>
                <input type="hidden" name="cafeId" value={cafeId} />
                <input type="hidden" name="itemId" value={item.id} />
                <Button type="submit" size="sm" variant="ghost" disabled={pending}>
                  {removeImagePending ? "Removing…" : "Remove image"}
                </Button>
              </form>
            ) : null}
            {uploadState.error || removeImageState.error ? (
              <p className="text-destructive text-sm">
                {uploadState.error ?? removeImageState.error}
              </p>
            ) : null}
          </div>

          <div className="border-t pt-4">
            <p className="text-muted-foreground mb-2 text-xs">
              Prefer marking unavailable. Hard delete is for setup mistakes — future
              orders should reference stable item ids.
            </p>
            <form
              action={deleteAction}
              onSubmit={(event) => {
                if (
                  !window.confirm(
                    `Delete “${item.name}”? Prefer unavailable if this item may appear on past orders later.`,
                  )
                ) {
                  event.preventDefault();
                }
              }}
            >
              <input type="hidden" name="cafeId" value={cafeId} />
              <input type="hidden" name="id" value={item.id} />
              <Button type="submit" size="sm" variant="destructive" disabled={pending}>
                {deletePending ? "Deleting…" : "Delete item"}
              </Button>
            </form>
          </div>
        </div>
      </dialog>
    </article>
  );
}
