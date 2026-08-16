"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

import { transitionOrderAction, type OrderActionState } from "@/features/orders/actions";
import {
  formatOrderNumber,
  nextOrderActions,
  ORDER_STATUS_LABELS,
  type CafeOrder,
  type OrderStatus,
} from "@/features/orders/types";
import { formatMenuPrice } from "@/features/menu/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function createOrdersRealtimeClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

const GROUPS: { key: OrderStatus | "active"; title: string; statuses: OrderStatus[] }[] =
  [
    { key: "pending", title: "New", statuses: ["pending"] },
    { key: "confirmed", title: "Confirmed", statuses: ["confirmed"] },
    { key: "preparing", title: "Preparing", statuses: ["preparing"] },
    { key: "ready", title: "Ready", statuses: ["ready"] },
    {
      key: "active",
      title: "Done",
      statuses: ["completed", "rejected"],
    },
  ];

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.max(0, Math.floor(diff / 60000));
  if (mins < 1) return "Just now";
  if (mins === 1) return "1 min ago";
  if (mins < 60) return `${mins} mins ago`;
  const hours = Math.floor(mins / 60);
  return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
}

type CafeOrdersBoardProps = {
  cafeId: string;
  currency: string;
  orders: CafeOrder[];
};

export function CafeOrdersBoard({ cafeId, currency, orders }: CafeOrdersBoardProps) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createOrdersRealtimeClient();
    const channel = supabase
      .channel(`orders-cafe-${cafeId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `cafe_id=eq.${cafeId}`,
        },
        () => {
          router.refresh();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [cafeId, router]);

  if (orders.length === 0) {
    return (
      <p className="text-muted-foreground rounded-lg border border-dashed p-8 text-center text-sm">
        No orders yet. When guests place orders from a table QR, they’ll show up here.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      {GROUPS.map((group) => {
        const groupOrders = orders.filter((order) =>
          group.statuses.includes(order.status),
        );
        if (groupOrders.length === 0) return null;
        return (
          <section key={group.title} className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide">
              {group.title}
            </h3>
            <ul className="space-y-3">
              {groupOrders.map((order) => (
                <OrderTicket
                  key={order.id}
                  cafeId={cafeId}
                  currency={currency}
                  order={order}
                />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function OrderTicket({
  cafeId,
  currency,
  order,
}: {
  cafeId: string;
  currency: string;
  order: CafeOrder;
}) {
  const initial: OrderActionState = {};
  const [state, action, pending] = useActionState(transitionOrderAction, initial);
  const actions = nextOrderActions(order.status);

  return (
    <li className="space-y-3 rounded-xl border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-lg font-semibold">{formatOrderNumber(order.order_number)}</p>
          <p className="text-muted-foreground text-sm">
            Table {order.table_code ?? "—"} · {order.item_count ?? 0} items ·{" "}
            {formatMenuPrice(order.total, currency)}
          </p>
          <p className="text-muted-foreground text-xs">{timeAgo(order.created_at)}</p>
        </div>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-xs font-medium capitalize",
            order.status === "pending" && "text-warning-foreground bg-amber-500/15",
            order.status === "rejected" && "bg-destructive/10 text-destructive",
            order.status !== "pending" &&
              order.status !== "rejected" &&
              "bg-muted text-muted-foreground",
          )}
        >
          {ORDER_STATUS_LABELS[order.status]}
        </span>
      </div>

      {order.notes ? (
        <p className="text-muted-foreground text-sm">Note: {order.notes}</p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button asChild size="sm" variant="outline">
          <Link href={`/dashboard/cafes/${cafeId}/orders/${order.id}`}>Details</Link>
        </Button>
        {actions.map((entry) => (
          <form key={entry.status} action={action}>
            <input type="hidden" name="cafeId" value={cafeId} />
            <input type="hidden" name="orderId" value={order.id} />
            <input type="hidden" name="status" value={entry.status} />
            <Button
              type="submit"
              size="sm"
              variant={entry.variant ?? "default"}
              disabled={pending}
            >
              {entry.label}
            </Button>
          </form>
        ))}
      </div>
      {state.error ? (
        <p className="text-destructive text-sm" role="alert">
          {state.error}
        </p>
      ) : null}
    </li>
  );
}
