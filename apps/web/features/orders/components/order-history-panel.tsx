"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import {
  formatOrderNumber,
  ORDER_OPS_LABELS,
  type CafeOrder,
} from "@/features/orders/types";
import { formatMenuPrice } from "@/features/menu/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const RANGES = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "7d", label: "Last 7 days" },
  { value: "all", label: "All" },
] as const;

type OrderHistoryPanelProps = {
  cafeId: string;
  currency: string;
  orders: CafeOrder[];
  page: number;
  hasMore: boolean;
  range: string;
  q: string;
};

export function OrderHistoryPanel({
  cafeId,
  currency,
  orders,
  page,
  hasMore,
  range,
  q,
}: OrderHistoryPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, start] = useTransition();

  function pushParams(patch: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (!value) params.delete(key);
      else params.set(key, value);
    }
    start(() => {
      router.push(`/dashboard/cafes/${cafeId}/orders/history?${params.toString()}`);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {RANGES.map((entry) => (
          <Button
            key={entry.value}
            type="button"
            size="sm"
            variant={range === entry.value ? "default" : "outline"}
            className="min-h-11"
            disabled={pending}
            onClick={() => pushParams({ range: entry.value, page: "1" })}
          >
            {entry.label}
          </Button>
        ))}
      </div>

      <form
        className="flex flex-wrap gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          pushParams({ q: String(form.get("q") ?? "").trim() || null, page: "1" });
        }}
      >
        <Input
          name="q"
          defaultValue={q}
          placeholder="Search order # or table"
          className="min-h-11 max-w-sm"
          aria-label="Search orders"
        />
        <Button type="submit" variant="secondary" className="min-h-11" disabled={pending}>
          Search
        </Button>
      </form>

      {orders.length === 0 ? (
        <p className="text-muted-foreground rounded-lg border border-dashed p-8 text-center text-sm">
          No completed or cancelled orders in this range.
        </p>
      ) : (
        <ul className="divide-y rounded-xl border">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                href={`/dashboard/cafes/${cafeId}/orders/${order.id}`}
                className="hover:bg-muted/40 flex flex-wrap items-center justify-between gap-3 px-4 py-3 transition-colors"
              >
                <div>
                  <p className="font-medium">
                    {formatOrderNumber(order.order_number)} · Table{" "}
                    {order.table_code ?? "—"}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {ORDER_OPS_LABELS[order.status]} ·{" "}
                    {new Date(order.created_at).toLocaleString()}
                  </p>
                </div>
                <p className="text-sm font-semibold tabular-nums">
                  {formatMenuPrice(order.total, currency)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          className="min-h-11"
          disabled={pending || page <= 1}
          onClick={() => pushParams({ page: String(page - 1) })}
        >
          Previous
        </Button>
        <Button
          type="button"
          variant="outline"
          className="min-h-11"
          disabled={pending || !hasMore}
          onClick={() => pushParams({ page: String(page + 1) })}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
