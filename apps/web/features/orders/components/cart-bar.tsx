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
  const totalLabel = formatMenuPrice(estimatedSubtotal.toFixed(2), currency);
  const countLabel = `${itemCount} ${itemCount === 1 ? "item" : "items"}`;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="pointer-events-auto mx-auto max-w-lg">
        <Button asChild className="min-h-14 w-full rounded-2xl text-base shadow-lg">
          <Link href={cartHref} aria-label={`View cart, ${countLabel}, ${totalLabel}`}>
            View cart · {countLabel} · {totalLabel}
          </Link>
        </Button>
      </div>
    </div>
  );
}
