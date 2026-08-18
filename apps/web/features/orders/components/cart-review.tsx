"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, Trash2 } from "lucide-react";

import { placeOrderAction } from "@/features/orders/actions";
import { useCart } from "@/features/orders/components/cart-provider";
import { formatMenuPrice } from "@/features/menu/types";
import type { PublicMenuItem } from "@/features/public-menu/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function newIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

type CartReviewProps = {
  cafeName?: string;
  menuItems?: PublicMenuItem[];
};

export function CartReview({ cafeName, menuItems = [] }: CartReviewProps) {
  const router = useRouter();
  const {
    cafeSlug,
    tableToken,
    tableCode,
    currency,
    lines,
    estimatedSubtotal,
    setQuantity,
    removeItem,
    clear,
    ready,
  } = useCart();
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const idempotencyKey = useMemo(() => newIdempotencyKey(), []);

  const menuById = useMemo(
    () => new Map(menuItems.map((item) => [item.id, item])),
    [menuItems],
  );

  const unavailableNames = useMemo(() => {
    if (menuItems.length === 0) return [];
    return lines
      .filter((line) => {
        const item = menuById.get(line.menuItemId);
        return !item || item.is_available === false;
      })
      .map((line) => line.name);
  }, [lines, menuById, menuItems.length]);

  const changedNames = useMemo(() => {
    if (menuItems.length === 0) return [];
    return lines
      .filter((line) => {
        const item = menuById.get(line.menuItemId);
        if (!item || item.is_available === false) return false;
        return Number(item.price) !== Number(line.unitPrice);
      })
      .map((line) => line.name);
  }, [lines, menuById, menuItems.length]);

  const menuHref = tableToken
    ? `/c/${encodeURIComponent(cafeSlug)}?table=${encodeURIComponent(tableToken)}`
    : `/c/${encodeURIComponent(cafeSlug)}`;

  if (!ready) {
    return (
      <p className="text-muted-foreground text-sm" role="status">
        Loading cart…
      </p>
    );
  }

  if (!tableToken) {
    return (
      <p className="text-muted-foreground text-sm">
        Scan a table QR code to place an order from this menu.
      </p>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="space-y-3 text-center">
        <p className="text-muted-foreground text-sm">Your cart is empty.</p>
        <Button asChild variant="outline" className="min-h-12">
          <a href={menuHref}>Browse menu</a>
        </Button>
      </div>
    );
  }

  function onPlaceOrder() {
    if (unavailableNames.length > 0) {
      setError(
        `Some items in your cart are no longer available: ${unavailableNames.join(", ")}.`,
      );
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const result = await placeOrderAction({
          cafeSlug,
          tableToken,
          notes,
          idempotencyKey,
          items: lines.map((line) => ({
            menuItemId: line.menuItemId,
            quantity: line.quantity,
          })),
        });

        if (!result.ok) {
          setError(result.error);
          return;
        }

        clear();
        router.push(
          `/c/${encodeURIComponent(cafeSlug)}/order/${encodeURIComponent(result.publicToken)}`,
        );
      } catch {
        setError("Connection problem. Please check your internet connection.");
      }
    });
  }

  return (
    <div className="space-y-6">
      {cafeName ? <p className="text-sm font-medium">{cafeName}</p> : null}
      {tableCode ? (
        <p className="text-muted-foreground text-sm">Table {tableCode}</p>
      ) : null}

      {unavailableNames.length > 0 ? (
        <p className="text-destructive text-sm" role="alert">
          Some items in your cart are no longer available: {unavailableNames.join(", ")}.
        </p>
      ) : null}
      {changedNames.length > 0 ? (
        <p className="text-muted-foreground text-sm" role="status">
          Some items in your cart have changed: {changedNames.join(", ")}. Totals are
          confirmed when you place the order.
        </p>
      ) : null}

      <ul className="space-y-3">
        {lines.map((line) => {
          const live = menuById.get(line.menuItemId);
          const unavailable =
            Boolean(live && live.is_available === false) ||
            (menuItems.length > 0 && !live);
          const lineTotal = Number(line.unitPrice) * line.quantity;
          return (
            <li
              key={line.menuItemId}
              className="flex items-start justify-between gap-3 rounded-xl border p-3"
            >
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium">{line.name}</p>
                  <p className="shrink-0 text-sm font-semibold tabular-nums">
                    {formatMenuPrice(lineTotal.toFixed(2), currency)}
                  </p>
                </div>
                <p className="text-muted-foreground text-xs">
                  {formatMenuPrice(line.unitPrice, currency)} each
                </p>
                {unavailable ? (
                  <p className="text-destructive text-xs">
                    This item is no longer available.
                  </p>
                ) : null}
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="size-11"
                    aria-label={`Decrease ${line.name}`}
                    disabled={pending}
                    onClick={() => setQuantity(line.menuItemId, line.quantity - 1)}
                  >
                    <Minus className="size-4" />
                  </Button>
                  <span className="min-w-8 text-center text-sm font-semibold tabular-nums">
                    {line.quantity}
                  </span>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="size-11"
                    aria-label={`Increase ${line.name}`}
                    disabled={pending || line.quantity >= 99}
                    onClick={() => setQuantity(line.menuItemId, line.quantity + 1)}
                  >
                    <Plus className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="size-11"
                    aria-label={`Remove ${line.name}`}
                    disabled={pending}
                    onClick={() => removeItem(line.menuItemId)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="space-y-2">
        <Label htmlFor="order-notes">Order note (optional)</Label>
        <Textarea
          id="order-notes"
          value={notes}
          maxLength={250}
          disabled={pending}
          placeholder="Less spicy, no onions…"
          onChange={(event) => setNotes(event.target.value)}
        />
      </div>

      <div className="space-y-2 border-t pt-4 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="tabular-nums">
            {formatMenuPrice(estimatedSubtotal.toFixed(2), currency)}
          </span>
        </div>
        <div className="flex items-center justify-between font-semibold">
          <span>Total</span>
          <span className="text-lg tabular-nums">
            {formatMenuPrice(estimatedSubtotal.toFixed(2), currency)}
          </span>
        </div>
        <p className="text-muted-foreground text-xs">
          Prices are confirmed by the cafe when you place the order.
        </p>
      </div>

      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col gap-2">
        <Button
          type="button"
          className="min-h-12 w-full"
          disabled={pending || unavailableNames.length > 0}
          onClick={onPlaceOrder}
        >
          {pending ? "Placing order…" : "Place order"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="min-h-11 w-full"
          disabled={pending}
          onClick={() => clear()}
        >
          Clear cart
        </Button>
      </div>
    </div>
  );
}
