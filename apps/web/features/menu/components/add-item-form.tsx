"use client";

import { useActionState } from "react";

import { createItemAction, type MenuActionState } from "@/features/menu/actions";
import type { MenuCategory } from "@/features/menu/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialState: MenuActionState = {};

type AddItemFormProps = {
  cafeId: string;
  categories: MenuCategory[];
  defaultCategoryId?: string;
};

export function AddItemForm({ cafeId, categories, defaultCategoryId }: AddItemFormProps) {
  const [state, formAction, pending] = useActionState(createItemAction, initialState);
  const activeCategories = categories.filter((category) => category.is_active);

  if (activeCategories.length === 0) {
    return (
      <p className="text-muted-foreground rounded-lg border border-dashed p-4 text-sm">
        Create an active category before adding menu items.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-4 rounded-lg border p-4">
      <div>
        <h3 className="text-sm font-medium">Add menu item</h3>
        <p className="text-muted-foreground text-xs">
          Price is stored as decimal currency (INR for now).
        </p>
      </div>

      <input type="hidden" name="cafeId" value={cafeId} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="item-name">Item name</Label>
          <Input
            id="item-name"
            name="name"
            required
            disabled={pending}
            maxLength={120}
            aria-invalid={Boolean(state.fieldErrors?.name)}
          />
          {state.fieldErrors?.name?.[0] ? (
            <p className="text-destructive text-sm">{state.fieldErrors.name[0]}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="item-price">Price (₹)</Label>
          <Input
            id="item-price"
            name="price"
            inputMode="decimal"
            placeholder="149.50"
            required
            disabled={pending}
            aria-invalid={Boolean(state.fieldErrors?.price)}
          />
          {state.fieldErrors?.price?.[0] ? (
            <p className="text-destructive text-sm">{state.fieldErrors.price[0]}</p>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="item-description">Description</Label>
        <Textarea
          id="item-description"
          name="description"
          rows={2}
          disabled={pending}
          maxLength={2000}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="item-category">Category</Label>
          <select
            id="item-category"
            name="categoryId"
            required
            disabled={pending}
            defaultValue={
              defaultCategoryId && defaultCategoryId !== "all"
                ? defaultCategoryId
                : activeCategories[0]?.id
            }
            className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm"
          >
            {activeCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {state.fieldErrors?.categoryId?.[0] ? (
            <p className="text-destructive text-sm">{state.fieldErrors.categoryId[0]}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="item-diet">Diet</Label>
          <select
            id="item-diet"
            name="diet"
            disabled={pending}
            defaultValue="vegetarian"
            className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm"
          >
            <option value="vegetarian">Vegetarian</option>
            <option value="non_vegetarian">Non-vegetarian</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="item-available">Availability</Label>
          <select
            id="item-available"
            name="isAvailable"
            disabled={pending}
            defaultValue="true"
            className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm"
          >
            <option value="true">Available</option>
            <option value="false">Unavailable</option>
          </select>
        </div>
      </div>

      {state.error ? <p className="text-destructive text-sm">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-700">{state.success}</p> : null}

      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Adding…" : "Add item"}
      </Button>
    </form>
  );
}
