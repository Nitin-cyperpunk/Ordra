"use client";

import Link from "next/link";

import { useCart } from "@/features/orders/components/cart-provider";
import { formatMenuPrice } from "@/features/menu/types";
import { Button } from "@/components/ui/button";

export function CartBar() {
  const { cafeSlug, tableToken, itemCount, estimatedSubtotal, currency, ready } =
    useCart();

  if (!ready || itemCount === 0 || !tableToken) return null;

  const cartHref = `/c/${encodeURIComponent(cafeSlug)}/cart?table=${encodeURIComponent(tableToken)}`;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="bg-primary text-primary-foreground pointer-events-auto mx-auto flex max-w-lg items-center justify-between gap-3 rounded-2xl border px-4 py-3 shadow-lg">
        <div className="min-w-0">
          <p className="text-sm font-semibold">
            {itemCount} {itemCount === 1 ? "item" : "items"} ·{" "}
            {formatMenuPrice(estimatedSubtotal.toFixed(2), currency)}
          </p>
          <p className="truncate text-xs opacity-80">Estimated · confirmed at checkout</p>
        </div>
        <Button
          asChild
          variant="secondary"
          className="text-secondary-foreground min-h-11 shrink-0"
        >
          <Link href={cartHref}>View cart</Link>
        </Button>
      </div>
    </div>
  );
}
