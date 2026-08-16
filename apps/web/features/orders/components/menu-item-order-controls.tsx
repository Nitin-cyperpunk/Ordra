"use client";

import { Minus, Plus } from "lucide-react";

import { useCart } from "@/features/orders/components/cart-provider";
import { formatMenuPrice } from "@/features/menu/types";
import type { PublicMenuItem } from "@/features/public-menu/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type MenuItemOrderControlsProps = {
  item: PublicMenuItem;
  currency: string;
  orderingEnabled: boolean;
};

export function MenuItemOrderControls({
  item,
  currency,
  orderingEnabled,
}: MenuItemOrderControlsProps) {
  const { lines, addItem, setQuantity } = useCart();
  const line = lines.find((entry) => entry.menuItemId === item.id);
  const quantity = line?.quantity ?? 0;

  if (!orderingEnabled) {
    return <p className="text-muted-foreground text-xs">Scan a table QR to order</p>;
  }

  if (quantity === 0) {
    return (
      <Button
        type="button"
        size="sm"
        className="min-h-10 min-w-10"
        aria-label={`Add ${item.name} to cart`}
        onClick={() =>
          addItem({
            menuItemId: item.id,
            name: item.name,
            unitPrice: item.price,
          })
        }
      >
        <Plus className="size-4" aria-hidden />
        Add
      </Button>
    );
  }

  return (
    <div
      className="inline-flex items-center gap-1 rounded-md border p-0.5"
      role="group"
      aria-label={`${item.name} quantity`}
    >
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="size-9"
        aria-label={`Decrease ${item.name}`}
        onClick={() => setQuantity(item.id, quantity - 1)}
      >
        <Minus className="size-4" aria-hidden />
      </Button>
      <span className="min-w-6 text-center text-sm font-semibold tabular-nums">
        {quantity}
      </span>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="size-9"
        aria-label={`Increase ${item.name}`}
        disabled={quantity >= 99}
        onClick={() => setQuantity(item.id, quantity + 1)}
      >
        <Plus className="size-4" aria-hidden />
      </Button>
      <span className={cn("text-muted-foreground sr-only")}>
        {formatMenuPrice(item.price, currency)} each
      </span>
    </div>
  );
}
