"use client";

import { useActionState } from "react";

import {
  createCategoryAction,
  deleteCategoryAction,
  reorderCategoryAction,
  setCategoryActiveAction,
  type MenuActionState,
} from "@/features/menu/actions";
import type { MenuCategory } from "@/features/menu/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const initialState: MenuActionState = {};

async function reorderCategoryFormAction(formData: FormData) {
  await reorderCategoryAction(initialState, formData);
}

async function setCategoryActiveFormAction(formData: FormData) {
  await setCategoryActiveAction(initialState, formData);
}

async function deleteCategoryFormAction(formData: FormData) {
  await deleteCategoryAction(initialState, formData);
}

type CategoriesPanelProps = {
  cafeId: string;
  categories: MenuCategory[];
  canManage: boolean;
  activeCategoryId: string;
};

export function CategoriesPanel({
  cafeId,
  categories,
  canManage,
  activeCategoryId,
}: CategoriesPanelProps) {
  const [createState, createAction, createPending] = useActionState(
    createCategoryAction,
    initialState,
  );

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-medium">Categories</h2>
        <p className="text-muted-foreground text-sm">
          Group items (Coffee, Snacks, Desserts).
        </p>
      </div>

      <nav
        aria-label="Menu categories"
        className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:flex-col lg:overflow-visible"
      >
        <CategoryTab
          href={`/dashboard/cafes/${cafeId}/menu`}
          label="All items"
          active={activeCategoryId === "all"}
        />
        {categories.map((category) => (
          <div key={category.id} className="flex min-w-max flex-col gap-1 lg:min-w-0">
            <CategoryTab
              href={`/dashboard/cafes/${cafeId}/menu?category=${category.id}`}
              label={category.name}
              active={activeCategoryId === category.id}
              inactive={!category.is_active}
            />
            {canManage ? (
              <div className="flex flex-wrap gap-1">
                <form action={reorderCategoryFormAction}>
                  <input type="hidden" name="cafeId" value={cafeId} />
                  <input type="hidden" name="id" value={category.id} />
                  <input type="hidden" name="direction" value="up" />
                  <Button
                    type="submit"
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs"
                  >
                    ↑
                  </Button>
                </form>
                <form action={reorderCategoryFormAction}>
                  <input type="hidden" name="cafeId" value={cafeId} />
                  <input type="hidden" name="id" value={category.id} />
                  <input type="hidden" name="direction" value="down" />
                  <Button
                    type="submit"
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs"
                  >
                    ↓
                  </Button>
                </form>
                <form action={setCategoryActiveFormAction}>
                  <input type="hidden" name="cafeId" value={cafeId} />
                  <input type="hidden" name="id" value={category.id} />
                  <input
                    type="hidden"
                    name="isActive"
                    value={category.is_active ? "false" : "true"}
                  />
                  <Button
                    type="submit"
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs"
                  >
                    {category.is_active ? "Deactivate" : "Activate"}
                  </Button>
                </form>
                <form
                  action={deleteCategoryFormAction}
                  onSubmit={(event) => {
                    if (
                      !window.confirm(
                        `Delete category “${category.name}”? Only empty categories can be deleted.`,
                      )
                    ) {
                      event.preventDefault();
                    }
                  }}
                >
                  <input type="hidden" name="cafeId" value={cafeId} />
                  <input type="hidden" name="id" value={category.id} />
                  <Button
                    type="submit"
                    size="sm"
                    variant="ghost"
                    className="text-destructive h-7 px-2 text-xs"
                  >
                    Delete
                  </Button>
                </form>
              </div>
            ) : null}
          </div>
        ))}
      </nav>

      {canManage ? (
        <form action={createAction} className="space-y-3 rounded-lg border p-4">
          <h3 className="text-sm font-medium">Add category</h3>
          <input type="hidden" name="cafeId" value={cafeId} />
          <div className="space-y-2">
            <Label htmlFor="category-name">Name</Label>
            <Input
              id="category-name"
              name="name"
              required
              disabled={createPending}
              maxLength={80}
              placeholder="Coffee"
            />
            {createState.fieldErrors?.name?.[0] ? (
              <p className="text-destructive text-sm">
                {createState.fieldErrors.name[0]}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="category-description">Description</Label>
            <Textarea
              id="category-description"
              name="description"
              rows={2}
              disabled={createPending}
              maxLength={500}
            />
          </div>
          {createState.error ? (
            <p className="text-destructive text-sm">{createState.error}</p>
          ) : null}
          {createState.success ? (
            <p className="text-sm text-emerald-700">{createState.success}</p>
          ) : null}
          <Button type="submit" size="sm" disabled={createPending}>
            {createPending ? "Adding…" : "Add category"}
          </Button>
        </form>
      ) : null}
    </section>
  );
}

function CategoryTab({
  href,
  label,
  active,
  inactive,
}: {
  href: string;
  label: string;
  active: boolean;
  inactive?: boolean;
}) {
  return (
    <a
      href={href}
      className={cn(
        "inline-flex h-9 items-center whitespace-nowrap rounded-md border px-3 text-sm",
        active
          ? "bg-primary text-primary-foreground border-transparent"
          : "bg-background hover:bg-accent",
        inactive && !active ? "text-muted-foreground opacity-70" : null,
      )}
    >
      {label}
      {inactive ? <span className="ml-1 text-xs">(off)</span> : null}
    </a>
  );
}
