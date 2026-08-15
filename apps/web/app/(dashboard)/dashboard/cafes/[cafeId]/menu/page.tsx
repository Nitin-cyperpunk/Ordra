import Link from "next/link";

import { getCafeById } from "@/features/cafes/actions";
import { listMenuCategories, listMenuItems } from "@/features/menu/actions";
import { AddItemForm } from "@/features/menu/components/add-item-form";
import { CategoriesPanel } from "@/features/menu/components/categories-panel";
import { MenuFilters, MenuItemsList } from "@/features/menu/components/menu-items-list";
import { canManageMenu, type MenuItemDiet } from "@/features/menu/types";
import { requireCafeAccess } from "@/features/memberships/access";
import { EmptyState } from "@/components/empty-state";
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
  const { role } = await requireCafeAccess(cafeId);
  const cafe = (await getCafeById(cafeId))!;
  const manage = canManageMenu(role);

  const q = filters.q?.trim() ?? "";
  const categoryId = filters.category?.trim() || "all";
  const availability = parseAvailability(filters.availability);
  const diet = parseDiet(filters.diet);
  const hasFilters =
    Boolean(q) || categoryId !== "all" || availability !== "all" || diet !== "all";

  const [categories, allItems, items] = await Promise.all([
    listMenuCategories(cafeId),
    listMenuItems(cafeId),
    listMenuItems(cafeId, {
      q: q || undefined,
      categoryId,
      availability,
      diet,
    }),
  ]);

  const isTrulyEmpty = allItems.length === 0 && categories.length === 0;

  return (
    <main className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">Menu</h2>
          <p className="text-muted-foreground text-sm">
            Build what you sell — name, price, and category. Photos and extras are
            optional.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {manage ? (
            <Button asChild variant="secondary" className="min-h-11">
              <Link href={`/dashboard/cafes/${cafeId}/menu/import`}>Import menu</Link>
            </Button>
          ) : null}
          {cafe.status === "active" ? (
            <Button asChild variant="outline" className="min-h-11">
              <Link href={`/c/${cafe.slug}`} target="_blank" rel="noreferrer">
                View public menu
              </Link>
            </Button>
          ) : (
            <p className="text-muted-foreground text-xs">
              Activate the cafe in Settings to publish the public menu.
            </p>
          )}
        </div>
      </div>

      {isTrulyEmpty ? (
        <div className="space-y-6">
          <EmptyState
            title="Your menu is empty"
            description="Import an existing PDF or photo of your menu, or start with a category like Coffee or Snacks."
          />
          {manage ? (
            <div className="flex flex-wrap gap-2">
              <Button asChild className="min-h-11">
                <Link href={`/dashboard/cafes/${cafeId}/menu/import`}>
                  Import your menu
                </Link>
              </Button>
            </div>
          ) : null}
          {manage ? (
            <CategoriesPanel
              cafeId={cafeId}
              categories={categories}
              canManage={manage}
              activeCategoryId={categoryId}
            />
          ) : (
            <p className="text-muted-foreground text-sm">
              Ask an owner or manager to set up the menu.
            </p>
          )}
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[16rem_minmax(0,1fr)]">
          <CategoriesPanel
            cafeId={cafeId}
            categories={categories}
            canManage={manage}
            activeCategoryId={categoryId}
          />

          <div className="space-y-6">
            {allItems.length > 0 ? (
              <MenuFilters
                cafeId={cafeId}
                categoryId={categoryId}
                q={q}
                availability={availability}
                diet={diet}
              />
            ) : null}

            {allItems.length === 0 ? (
              <EmptyState
                title="No items yet"
                description="Add your first item and start building your digital menu."
              />
            ) : (
              <MenuItemsList
                cafeId={cafeId}
                items={items}
                categories={categories}
                canManage={manage}
                currency={cafe.currency ?? "INR"}
                filteredEmpty={hasFilters && items.length === 0}
              />
            )}

            {manage ? (
              <div id="add-item">
                <AddItemForm
                  cafeId={cafeId}
                  categories={categories}
                  defaultCategoryId={categoryId}
                />
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                You can browse the menu. Only owners and managers can edit it.
              </p>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
