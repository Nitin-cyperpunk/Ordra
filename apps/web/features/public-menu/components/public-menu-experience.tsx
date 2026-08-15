"use client";

import { CartProvider } from "@/features/orders/components/cart-provider";
import { PublicMenuView } from "@/features/public-menu/components/public-menu-view";
import type {
  PublicCafe,
  PublicMenuCategory,
  PublicMenuItem,
  PublicTableContext,
} from "@/features/public-menu/types";

type PublicMenuExperienceProps = {
  cafe: PublicCafe;
  categories: PublicMenuCategory[];
  items: PublicMenuItem[];
  table: PublicTableContext | null;
  tableUnavailable: boolean;
};

export function PublicMenuExperience({
  cafe,
  categories,
  items,
  table,
  tableUnavailable,
}: PublicMenuExperienceProps) {
  return (
    <CartProvider
      cafeSlug={cafe.slug}
      tableToken={table?.publicToken ?? null}
      tableCode={table?.code ?? null}
      currency={cafe.currency}
    >
      <PublicMenuView
        cafe={cafe}
        categories={categories}
        items={items}
        table={table}
        tableUnavailable={tableUnavailable}
      />
    </CartProvider>
  );
}
