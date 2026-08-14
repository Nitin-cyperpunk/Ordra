import Link from "next/link";

import { getCafeById } from "@/features/cafes/actions";
import { requireCafeAccess } from "@/features/memberships/access";
import { SyncActiveCafe } from "@/features/memberships/components/sync-active-cafe";
import { listMenuCategories, listMenuItems } from "@/features/menu/actions";
import { AddItemForm } from "@/features/menu/components/add-item-form";
import { CategoriesPanel } from "@/features/menu/components/categories-panel";
import { MenuFilters, MenuItemsList } from "@/features/menu/components/menu-items-list";
import { canManageMenu, type MenuItemDiet } from "@/features/menu/types";
import { Button } from "@/components/ui/button";

type MenuPageProps = {
  params: Promise<{ cafeId: string }>;
  searchParams: Promise<{
    q?: string;
    category?: string;
    availability?: string;
    diet?: string;
  }>;
};

export async function generateMetadata({ params }: MenuPageProps) {
  const { cafeId } = await params;
  const cafe = await getCafeById(cafeId);
  return {
    title: cafe ? `Menu · ${cafe.name}` : "Menu · Ordra",
    robots: { index: false, follow: false },
  };
}

function parseAvailability(
  value: string | undefined,
): "all" | "available" | "unavailable" {
  if (value === "available" || value === "unavailable") return value;
  return "all";
}

function parseDiet(value: string | undefined): "all" | MenuItemDiet {
  if (value === "vegetarian" || value === "non_vegetarian") return value;
  return "all";
}

export default async function CafeMenuPage({ params, searchParams }: MenuPageProps) {
  const { cafeId } = await params;
  const filters = await searchParams;
  const { cafe, role } = await requireCafeAccess(cafeId);
  const manage = canManageMenu(role);

  const q = filters.q?.trim() ?? "";
  const categoryId = filters.category?.trim() || "all";
  const availability = parseAvailability(filters.availability);
  const diet = parseDiet(filters.diet);

  const [categories, items] = await Promise.all([
    listMenuCategories(cafeId),
    listMenuItems(cafeId, {
      q: q || undefined,
      categoryId,
      availability,
      diet,
    }),
  ]);

  return (
    <main className="mx-auto max-w-5xl space-y-8">
      <SyncActiveCafe cafeId={cafeId} />

      <div className="space-y-2">
        <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">
          Cafe workspace · Menu
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">{cafe.name}</h1>
        <p className="text-muted-foreground text-sm">
          Manage categories, prices, availability, and item images. Customer-facing
          digital menu and QR ordering come later.
        </p>
        <p className="text-muted-foreground text-sm">
          Your role: <span className="text-foreground capitalize">{role}</span>
          {" · "}
          Currency: <span className="text-foreground">{cafe.currency ?? "INR"}</span>
          {" · "}
          {items.length} items shown
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <CategoriesPanel
          cafeId={cafeId}
          categories={categories}
          canManage={manage}
          activeCategoryId={categoryId}
        />

        <div className="space-y-6">
          <MenuFilters
            cafeId={cafeId}
            categoryId={categoryId}
            q={q}
            availability={availability}
            diet={diet}
          />

          <MenuItemsList
            cafeId={cafeId}
            items={items}
            categories={categories}
            canManage={manage}
            currency={cafe.currency ?? "INR"}
          />

          {manage ? (
            <AddItemForm
              cafeId={cafeId}
              categories={categories}
              defaultCategoryId={categoryId}
            />
          ) : (
            <p className="text-muted-foreground text-sm">
              Only owners and managers can edit the menu. You can still browse items.
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href={`/dashboard/cafes/${cafeId}`}>Cafe workspace</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href={`/dashboard/cafes/${cafeId}/tables`}>Tables</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard">All cafes</Link>
        </Button>
      </div>
    </main>
  );
}
