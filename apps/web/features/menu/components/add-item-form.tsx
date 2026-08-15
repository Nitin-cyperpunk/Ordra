"use client";

import { useActionState, useState } from "react";

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
  const [showMore, setShowMore] = useState(false);
  const activeCategories = categories.filter((category) => category.is_active);

  if (activeCategories.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-4 text-sm">
        <p className="font-medium">Add a category first</p>
        <p className="text-muted-foreground mt-1">
          Create something like Coffee or Snacks on the left, then come back to add items.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4 rounded-xl border p-4 sm:p-5">
      <div>
        <h3 className="text-base font-semibold tracking-tight">
          Add something delicious
        </h3>
        <p className="text-muted-foreground text-sm">
          Name, price, and category are enough to start.
        </p>
      </div>

      <input type="hidden" name="cafeId" value={cafeId} />
      <input type="hidden" name="isAvailable" value="true" />
      {!showMore ? <input type="hidden" name="diet" value="vegetarian" /> : null}

      <div className="space-y-2">
        <Label htmlFor="item-name">Name</Label>
        <Input
          id="item-name"
          name="name"
          required
          disabled={pending}
          maxLength={120}
          placeholder="Cappuccino"
          className="min-h-11"
          aria-invalid={Boolean(state.fieldErrors?.name)}
        />
        {state.fieldErrors?.name?.[0] ? (
          <p className="text-destructive text-sm">{state.fieldErrors.name[0]}</p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="item-price">Price (₹)</Label>
          <Input
            id="item-price"
            name="price"
            inputMode="decimal"
            placeholder="149"
            required
            disabled={pending}
            className="min-h-11"
            aria-invalid={Boolean(state.fieldErrors?.price)}
          />
          {state.fieldErrors?.price?.[0] ? (
            <p className="text-destructive text-sm">{state.fieldErrors.price[0]}</p>
          ) : null}
        </div>

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
            className="border-input bg-background flex min-h-11 w-full rounded-md border px-3 py-2 text-sm shadow-sm"
          >
            {activeCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="button"
        className="text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline"
        onClick={() => setShowMore((value) => !value)}
      >
        {showMore ? "Hide extra options" : "More options"}
      </button>

      {showMore ? (
        <div className="space-y-4 border-t pt-4">
          <div className="space-y-2">
            <Label htmlFor="item-description">Description</Label>
            <Textarea
              id="item-description"
              name="description"
              rows={2}
              disabled={pending}
              maxLength={2000}
              placeholder="Optional — what makes it special?"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="item-diet">Vegetarian?</Label>
            <select
              id="item-diet"
              name="diet"
              disabled={pending}
              defaultValue="vegetarian"
              className="border-input bg-background flex min-h-11 w-full rounded-md border px-3 py-2 text-sm shadow-sm"
            >
              <option value="vegetarian">Yes — vegetarian</option>
              <option value="non_vegetarian">No — non-vegetarian</option>
            </select>
          </div>
        </div>
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
        {pending ? "Saving…" : "Add to menu"}
      </Button>
    </form>
  );
}
