import type { MenuCategory, MenuItem } from "@/features/menu/types";
import { MenuItemCard } from "@/features/menu/components/menu-item-card";
import { publicCafeAssetUrl } from "@/features/menu/storage";
import { getSupabaseUrl } from "@/lib/supabase/env";

function itemImageUrl(imagePath: string | null): string | null {
  if (!imagePath) return null;
  return publicCafeAssetUrl(getSupabaseUrl(), imagePath);
}
type MenuItemsListProps = {
  cafeId: string;
  items: MenuItem[];
  categories: MenuCategory[];
  canManage: boolean;
  currency?: string;
};

export function MenuItemsList({
  cafeId,
  items,
  categories,
  canManage,
  currency = "INR",
}: MenuItemsListProps) {
  if (items.length === 0) {
    return (
      <p className="text-muted-foreground rounded-lg border border-dashed p-6 text-center text-sm">
        No menu items match these filters.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.id}>
          <MenuItemCard
            cafeId={cafeId}
            item={item}
            categories={categories}
            canManage={canManage}
            imageUrl={itemImageUrl(item.image_path)}
            currency={currency}
          />
        </li>
      ))}
    </ul>
  );
}

type MenuFiltersProps = {
  cafeId: string;
  categoryId: string;
  q: string;
  availability: string;
  diet: string;
};

export function MenuFilters({
  cafeId,
  categoryId,
  q,
  availability,
  diet,
}: MenuFiltersProps) {
  return (
    <form
      method="get"
      action={`/dashboard/cafes/${cafeId}/menu`}
      className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:flex-wrap sm:items-end"
    >
      {categoryId !== "all" ? (
        <input type="hidden" name="category" value={categoryId} />
      ) : null}

      <div className="space-y-1 sm:min-w-[12rem] sm:flex-1">
        <label htmlFor="q" className="text-muted-foreground text-xs font-medium">
          Search
        </label>
        <input
          id="q"
          name="q"
          defaultValue={q}
          placeholder="Cappuccino"
          className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm"
        />
      </div>

      <div className="space-y-1 sm:w-40">
        <label
          htmlFor="availability"
          className="text-muted-foreground text-xs font-medium"
        >
          Availability
        </label>
        <select
          id="availability"
          name="availability"
          defaultValue={availability}
          className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm"
        >
          <option value="all">All</option>
          <option value="available">Available</option>
          <option value="unavailable">Unavailable</option>
        </select>
      </div>

      <div className="space-y-1 sm:w-44">
        <label htmlFor="diet" className="text-muted-foreground text-xs font-medium">
          Diet
        </label>
        <select
          id="diet"
          name="diet"
          defaultValue={diet}
          className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm"
        >
          <option value="all">All</option>
          <option value="vegetarian">Vegetarian</option>
          <option value="non_vegetarian">Non-vegetarian</option>
        </select>
      </div>

      <button
        type="submit"
        className="bg-primary text-primary-foreground inline-flex h-9 items-center rounded-md px-3 text-sm font-medium"
      >
        Filter
      </button>
    </form>
  );
}
