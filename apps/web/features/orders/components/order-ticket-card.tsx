"use client";

import { useActionState, useState } from "react";
import Link from "next/link";

import { transitionOrderAction, type OrderActionState } from "@/features/orders/actions";
import { OrderAge } from "@/features/orders/components/order-age";
import {
  formatOrderNumber,
  nextOrderActions,
  orderAgeUrgency,
  type CafeOrder,
} from "@/features/orders/types";
import { formatMenuPrice } from "@/features/menu/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type OrderTicketCardProps = {
  cafeId: string;
  currency: string;
  order: CafeOrder;
  variant?: "board" | "kitchen";
  detailsHref?: boolean;
};

export function OrderTicketCard({
  cafeId,
  currency,
  order,
  variant = "board",
  detailsHref = true,
}: OrderTicketCardProps) {
  const initial: OrderActionState = {};
  const [state, action, pending] = useActionState(transitionOrderAction, initial);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const actions = nextOrderActions(order.status);
  const urgency = orderAgeUrgency(order.created_at);
  const isKitchen = variant === "kitchen";

  return (
    <article
      className={cn(
        "space-y-3 rounded-xl border p-4",
        urgency === "aging" && "border-amber-500/35",
        urgency === "stale" && "border-destructive/40",
        isKitchen && "min-h-[12rem]",
      )}
      aria-label={`Order ${formatOrderNumber(order.order_number)}, table ${order.table_code ?? "unknown"}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-1">
          <p
            className={cn(
              "font-semibold tracking-tight",
              isKitchen ? "text-2xl" : "text-xl",
            )}
          >
            {formatOrderNumber(order.order_number)}
          </p>
          <p
            className={cn(
              "font-medium uppercase tracking-wide",
              isKitchen ? "text-base" : "text-sm",
            )}
          >
            Table {order.table_code ?? "—"}
          </p>
        </div>
        <OrderAge createdAt={order.created_at} />
      </div>

      {order.lines && order.lines.length > 0 ? (
        <ul className={cn("space-y-1", isKitchen ? "text-base" : "text-sm")}>
          {order.lines.map((line, index) => (
            <li key={`${line.name}-${index}`}>
              <span className="font-medium tabular-nums">{line.quantity} ×</span>{" "}
              {line.name}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground text-sm">{order.item_count ?? 0} items</p>
      )}

      {order.notes ? (
        <p
          className={cn(
            "rounded-lg bg-amber-500/10 px-3 py-2 text-sm",
            isKitchen && "text-base",
          )}
        >
          <span className="font-medium">Note:</span> {order.notes}
        </p>
      ) : null}

      {!isKitchen ? (
        <p className="text-sm font-semibold tabular-nums">
          {formatMenuPrice(order.total, currency)}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {detailsHref && !isKitchen ? (
          <Button asChild size="sm" variant="outline" className="min-h-11">
            <Link href={`/dashboard/cafes/${cafeId}/orders/${order.id}`}>Details</Link>
          </Button>
        ) : null}

        {actions.map((entry) => {
          if (entry.needsReason) {
            return (
              <Button
                key={entry.status}
                type="button"
                size={isKitchen ? "default" : "sm"}
                variant={entry.variant ?? "default"}
                className="min-h-11"
                disabled={pending}
                onClick={() => setCancelOpen((open) => !open)}
              >
                {entry.label}
              </Button>
            );
          }

          return (
            <form key={entry.status} action={action}>
              <input type="hidden" name="cafeId" value={cafeId} />
              <input type="hidden" name="orderId" value={order.id} />
              <input type="hidden" name="status" value={entry.status} />
              <Button
                type="submit"
                size={isKitchen ? "default" : "sm"}
                variant={entry.variant ?? "default"}
                className="min-h-11"
                disabled={pending}
              >
                {entry.label}
              </Button>
            </form>
          );
        })}
      </div>

      {cancelOpen ? (
        <form
          action={action}
          className="space-y-2 rounded-lg border border-dashed p-3"
          onSubmit={() => setCancelOpen(false)}
        >
          <input type="hidden" name="cafeId" value={cafeId} />
          <input type="hidden" name="orderId" value={order.id} />
          <input type="hidden" name="status" value="rejected" />
          <label
            className="text-muted-foreground block text-xs"
            htmlFor={`reason-${order.id}`}
          >
            Cancel reason (optional)
          </label>
          <Input
            id={`reason-${order.id}`}
            name="note"
            value={cancelReason}
            onChange={(event) => setCancelReason(event.target.value)}
            placeholder="Item unavailable"
            maxLength={250}
            className="min-h-11"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="submit"
              variant="destructive"
              className="min-h-11"
              disabled={pending}
            >
              Cancel order
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="min-h-11"
              onClick={() => setCancelOpen(false)}
            >
              Keep
            </Button>
          </div>
        </form>
      ) : null}

      {state.error ? (
        <p className="text-destructive text-sm" role="alert">
          {state.error}
        </p>
      ) : null}
    </article>
  );
}
