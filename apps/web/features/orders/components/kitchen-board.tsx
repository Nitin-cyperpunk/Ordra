"use client";

import Link from "next/link";

import { OrderTicketCard } from "@/features/orders/components/order-ticket-card";
import {
  OrdersConnectionBanner,
  useOrdersRealtime,
} from "@/features/orders/components/use-orders-realtime";
import {
  ORDER_OPS_LABELS,
  type CafeOrder,
  type OrderStatus,
} from "@/features/orders/types";
import { Button } from "@/components/ui/button";

const KITCHEN_COLUMNS: OrderStatus[] = ["pending", "confirmed", "preparing", "ready"];

type KitchenBoardProps = {
  cafeId: string;
  currency: string;
  cafeName: string;
  orders: CafeOrder[];
};

export function KitchenBoard({ cafeId, currency, cafeName, orders }: KitchenBoardProps) {
  const { connection, soundEnabled, soundError, toggleSound } = useOrdersRealtime(
    cafeId,
    {
      enableSound: true,
    },
  );

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs uppercase tracking-wide">
            Kitchen mode
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {cafeName}
          </h1>
          <p className="text-muted-foreground text-sm">
            Focus on items and tables. No settings or analytics here.
          </p>
        </div>
        <div className="flex flex-wrap items-start gap-2">
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
          <Button asChild variant="secondary" className="min-h-11">
            <Link href={`/dashboard/cafes/${cafeId}/orders`}>Exit kitchen</Link>
          </Button>
        </div>
      </header>

      <OrdersConnectionBanner connection={connection} />

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        {KITCHEN_COLUMNS.map((status) => {
          const columnOrders = orders.filter((order) => order.status === status);
          return (
            <section
              key={status}
              className="flex min-h-[16rem] flex-col gap-3 rounded-2xl border p-3"
              aria-label={`${ORDER_OPS_LABELS[status]}`}
            >
              <h2 className="px-1 text-lg font-semibold tracking-tight">
                {ORDER_OPS_LABELS[status]}
                <span className="text-muted-foreground ml-2 text-sm font-normal tabular-nums">
                  {columnOrders.length}
                </span>
              </h2>
              <div className="flex flex-1 flex-col gap-3">
                {columnOrders.length === 0 ? (
                  <p className="text-muted-foreground px-1 text-sm">Clear</p>
                ) : (
                  columnOrders.map((order) => (
                    <OrderTicketCard
                      key={order.id}
                      cafeId={cafeId}
                      currency={currency}
                      order={order}
                      variant="kitchen"
                      detailsHref={false}
                    />
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
