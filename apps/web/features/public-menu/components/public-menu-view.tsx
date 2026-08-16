import { dietLabel, formatMenuPrice } from "@/features/menu/types";
import { publicCafeAssetUrl } from "@/features/menu/storage";
import type {
  PublicCafe,
  PublicMenuCategory,
  PublicMenuItem,
  PublicTableContext,
} from "@/features/public-menu/types";
import { CartBar } from "@/features/orders/components/cart-bar";
import { MenuItemOrderControls } from "@/features/orders/components/menu-item-order-controls";
import { ThemeToggle } from "@/components/theme-toggle";
import { getSupabaseUrl } from "@/lib/supabase/env";
import { cn } from "@/lib/utils";

function itemImageUrl(imagePath: string | null): string | null {
  if (!imagePath) return null;
  try {
    return publicCafeAssetUrl(getSupabaseUrl(), imagePath);
  } catch {
    return null;
  }
}

type PublicMenuViewProps = {
  cafe: PublicCafe;
  categories: PublicMenuCategory[];
  items: PublicMenuItem[];
  table?: PublicTableContext | null;
  tableUnavailable?: boolean;
};

export function PublicMenuView({
  cafe,
  categories,
  items,
  table = null,
  tableUnavailable = false,
}: PublicMenuViewProps) {
  const orderingEnabled = Boolean(table?.publicToken);
  const itemsByCategory = new Map<string, PublicMenuItem[]>();
  for (const item of items) {
    const list = itemsByCategory.get(item.category_id) ?? [];
    list.push(item);
    itemsByCategory.set(item.category_id, list);
  }

  const visibleCategories = categories.filter(
    (category) => (itemsByCategory.get(category.id)?.length ?? 0) > 0,
  );

  return (
    <div
      className={cn(
        "mx-auto min-h-screen w-full max-w-lg px-4 pt-8 sm:px-6",
        orderingEnabled ? "pb-28" : "pb-16",
      )}
    >
      <header className="space-y-3 border-b pb-6">
        <p className="text-muted-foreground text-xs font-medium uppercase tracking-[0.2em]">
          Menu
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">{cafe.name}</h1>
        {table ? (
          <p className="text-muted-foreground text-sm" aria-live="polite">
            Table {table.code}
          </p>
        ) : tableUnavailable ? (
          <p className="text-muted-foreground text-sm" aria-live="polite">
            Table information unavailable.
          </p>
        ) : (
          <p className="text-muted-foreground text-sm">
            Browse the menu. Scan a table QR to place an order.
          </p>
        )}
        {cafe.city ? <p className="text-muted-foreground text-sm">{cafe.city}</p> : null}
        {cafe.description ? (
          <p className="text-muted-foreground whitespace-pre-wrap text-sm leading-relaxed">
            {cafe.description}
          </p>
        ) : null}
      </header>

      {visibleCategories.length === 0 ? (
        <p className="text-muted-foreground mt-10 text-center text-sm">
          This cafe hasn’t published menu items yet. Check back soon.
        </p>
      ) : (
        <>
          <nav
            aria-label="Menu categories"
            className="-mx-1 mt-6 flex gap-2 overflow-x-auto px-1 pb-2"
          >
            {visibleCategories.map((category) => (
              <a
                key={category.id}
                href={`#${categoryAnchor(category.id)}`}
                className="bg-secondary text-secondary-foreground inline-flex min-h-10 shrink-0 items-center rounded-full px-3 text-sm font-medium"
              >
                {category.name}
              </a>
            ))}
          </nav>

          <div className="mt-8 space-y-10">
            {visibleCategories.map((category) => (
              <section
                key={category.id}
                id={categoryAnchor(category.id)}
                className="scroll-mt-6 space-y-4"
              >
                <div className="space-y-1">
                  <h2 className="text-xl font-semibold tracking-tight">
                    {category.name}
                  </h2>
                  {category.description ? (
                    <p className="text-muted-foreground text-sm">
                      {category.description}
                    </p>
                  ) : null}
                </div>

                <ul className="space-y-3">
                  {(itemsByCategory.get(category.id) ?? []).map((item) => (
                    <PublicMenuItemCard
                      key={item.id}
                      item={item}
                      currency={cafe.currency}
                      orderingEnabled={orderingEnabled}
                    />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </>
      )}

      <footer className="text-muted-foreground mt-16 flex flex-col items-center gap-3 border-t pt-6 text-center text-xs">
        <ThemeToggle />
        <p>Powered by Ordra</p>
      </footer>

      <CartBar />
    </div>
  );
}

function PublicMenuItemCard({
  item,
  currency,
  orderingEnabled,
}: {
  item: PublicMenuItem;
  currency: string;
  orderingEnabled: boolean;
}) {
  const imageUrl = itemImageUrl(item.image_path);

  return (
    <li className="flex gap-3 rounded-xl border p-3">
      <div
        className={cn(
          "bg-muted relative h-20 w-20 shrink-0 overflow-hidden rounded-lg",
          !imageUrl && "hidden sm:flex sm:items-center sm:justify-center",
        )}
      >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="text-muted-foreground text-[10px]">No photo</span>
        )}
      </div>

      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-medium leading-snug">{item.name}</h3>
          <p className="shrink-0 text-sm font-semibold tabular-nums">
            {formatMenuPrice(item.price, currency)}
          </p>
        </div>
        {item.description ? (
          <p className="text-muted-foreground line-clamp-2 text-sm leading-relaxed">
            {item.description}
          </p>
        ) : null}
        <div className="flex items-center justify-between gap-2">
          <p className="text-muted-foreground text-xs">{dietLabel(item.diet)}</p>
          <MenuItemOrderControls
            item={item}
            currency={currency}
            orderingEnabled={orderingEnabled}
          />
        </div>
      </div>
    </li>
  );
}

function categoryAnchor(categoryId: string): string {
  return `cat-${categoryId}`;
}
