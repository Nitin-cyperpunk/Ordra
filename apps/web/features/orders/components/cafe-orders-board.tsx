"use client";

import Link from "next/link";

import { OrderTicketCard } from "@/features/orders/components/order-ticket-card";
import {
  OrdersConnectionBanner,
  useOrdersRealtime,
} from "@/features/orders/components/use-orders-realtime";
import {
  ACTIVE_ORDER_STATUSES,
  ORDER_OPS_LABELS,
  type CafeOrder,
  type OrderStatus,
} from "@/features/orders/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const COLUMNS: OrderStatus[] = ["pending", "confirmed", "preparing", "ready"];

type CafeOrdersBoardProps = {
  cafeId: string;
  currency: string;
  orders: CafeOrder[];
};

export function CafeOrdersBoard({ cafeId, currency, orders }: CafeOrdersBoardProps) {
  const { connection, soundEnabled, soundError, toggleSound } = useOrdersRealtime(
    cafeId,
    {
      enableSound: true,
    },
  );

  const active = orders.filter((order) => ACTIVE_ORDER_STATUSES.includes(order.status));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="secondary" className="min-h-11">
            <Link href={`/dashboard/cafes/${cafeId}/kitchen`}>Kitchen mode</Link>
          </Button>
          <Button asChild variant="outline" className="min-h-11">
            <Link href={`/dashboard/cafes/${cafeId}/orders/history`}>History</Link>
          </Button>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            onClick={toggleSound}
            aria-pressed={soundEnabled}
            aria-label={
              soundEnabled
                ? "Order chime on. Click to turn off"
                : "Order chime off. Click to enable and hear a test ding"
            }
          >
            {soundEnabled ? "Sound on" : "Sound off"}
          </Button>
          {soundError ? (
            <p className="text-destructive max-w-56 text-right text-xs" role="alert">
              {soundError}
            </p>
          ) : null}
        </div>
      </div>

      <OrdersConnectionBanner connection={connection} />

      {active.length === 0 ? (
        <p className="text-muted-foreground rounded-lg border border-dashed p-8 text-center text-sm">
          No active orders. New table orders will appear here live.
        </p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
          {COLUMNS.map((status) => {
            const columnOrders = active.filter((order) => order.status === status);
            return (
              <section
                key={status}
                className="bg-muted/20 flex min-h-[12rem] flex-col gap-3 rounded-2xl border p-3"
                aria-label={`${ORDER_OPS_LABELS[status]} orders`}
              >
                <header className="flex items-baseline justify-between gap-2 px-1">
                  <h3 className="text-sm font-semibold uppercase tracking-wide">
                    {ORDER_OPS_LABELS[status]}
                  </h3>
                  <span
                    className={cn(
                      "text-muted-foreground text-xs tabular-nums",
                      columnOrders.length > 0 && status === "pending" && "font-semibold",
                    )}
                  >
                    {columnOrders.length}
                  </span>
                </header>
                <div className="flex flex-1 flex-col gap-3">
                  {columnOrders.length === 0 ? (
                    <p className="text-muted-foreground px-1 text-xs">None</p>
                  ) : (
                    columnOrders.map((order) => (
                      <OrderTicketCard
                        key={order.id}
                        cafeId={cafeId}
                        currency={currency}
                        order={order}
                        variant="board"
                      />
                    ))
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
