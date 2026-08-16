"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, Trash2 } from "lucide-react";

import { placeOrderAction } from "@/features/orders/actions";
import { useCart } from "@/features/orders/components/cart-provider";
import { formatMenuPrice } from "@/features/menu/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function newIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function CartReview() {
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
  } = useCart();
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const idempotencyKey = useMemo(() => newIdempotencyKey(), []);

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
        <Button asChild variant="outline">
          <a
            href={`/c/${encodeURIComponent(cafeSlug)}?table=${encodeURIComponent(tableToken)}`}
          >
            Back to menu
          </a>
        </Button>
      </div>
    );
  }

  function onPlaceOrder() {
    setError(null);
    startTransition(async () => {
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
      router.push(`/order/${result.publicToken}`);
    });
  }

  return (
    <div className="space-y-6">
      {tableCode ? (
        <p className="text-muted-foreground text-sm">Table {tableCode}</p>
      ) : null}

      <ul className="space-y-3">
        {lines.map((line) => {
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
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="size-9"
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
                    className="size-9"
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
                    className="size-9"
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

      <div className="flex items-center justify-between border-t pt-4 text-sm">
        <span className="text-muted-foreground">Subtotal (estimated)</span>
        <span className="text-lg font-semibold tabular-nums">
          {formatMenuPrice(estimatedSubtotal.toFixed(2), currency)}
        </span>
      </div>

      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}

      <Button
        type="button"
        className="min-h-12 w-full"
        disabled={pending}
        onClick={onPlaceOrder}
      >
        {pending ? "Placing order…" : "Place order"}
      </Button>
    </div>
  );
}
