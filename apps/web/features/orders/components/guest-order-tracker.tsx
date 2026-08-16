import {
  formatOrderNumber,
  ORDER_STATUS_LABELS,
  type GuestOrderView,
  type OrderStatus,
} from "@/features/orders/types";
import { formatMenuPrice } from "@/features/menu/types";
import { cn } from "@/lib/utils";

const TRACK_STEPS: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "completed",
];

function stepState(
  status: OrderStatus,
  step: OrderStatus,
): "done" | "current" | "upcoming" | "rejected" {
  if (status === "rejected") {
    return step === "pending" ? "rejected" : "upcoming";
  }
  const currentIdx = TRACK_STEPS.indexOf(status);
  const stepIdx = TRACK_STEPS.indexOf(step);
  if (stepIdx < currentIdx) return "done";
  if (stepIdx === currentIdx) return "current";
  return "upcoming";
}

export function GuestOrderTracker({ order }: { order: GuestOrderView }) {
  return (
    <div className="mx-auto w-full max-w-lg space-y-8 px-4 py-8 sm:px-6">
      <header className="space-y-2 border-b pb-6">
        <p className="text-muted-foreground text-xs font-medium uppercase tracking-[0.2em]">
          Order placed
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          {formatOrderNumber(order.order_number)}
        </h1>
        <p className="text-muted-foreground text-sm">
          {order.cafe_name}
          {order.table_code ? ` · Table ${order.table_code}` : ""}
        </p>
        <p className="text-sm font-medium">{ORDER_STATUS_LABELS[order.status]}</p>
      </header>

      {order.status === "rejected" ? (
        <p className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border px-3 py-2 text-sm">
          This order was rejected by the cafe. You can place a new order from the menu.
        </p>
      ) : (
        <ol className="space-y-3" aria-label="Order progress">
          {TRACK_STEPS.map((step) => {
            const state = stepState(order.status, step);
            return (
              <li key={step} className="flex items-center gap-3 text-sm">
                <span
                  className={cn(
                    "flex size-7 items-center justify-center rounded-full border text-xs font-semibold",
                    state === "done" && "border-emerald-600 bg-emerald-600 text-white",
                    state === "current" &&
                      "border-primary bg-primary text-primary-foreground",
                    state === "upcoming" &&
                      "border-muted-foreground/30 text-muted-foreground",
                    state === "rejected" &&
                      "border-destructive bg-destructive text-destructive-foreground",
                  )}
                  aria-hidden
                >
                  {state === "done" || state === "rejected"
                    ? "✓"
                    : state === "current"
                      ? "●"
                      : "○"}
                </span>
                <span
                  className={cn(
                    state === "upcoming" && "text-muted-foreground",
                    state === "current" && "font-medium",
                  )}
                >
                  {ORDER_STATUS_LABELS[step]}
                </span>
              </li>
            );
          })}
        </ol>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Items</h2>
        <ul className="space-y-2">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-3 text-sm">
              <span>
                {item.name} × {item.quantity}
              </span>
              <span className="tabular-nums">
                {formatMenuPrice(String(item.line_total), order.currency)}
              </span>
            </li>
          ))}
        </ul>
        {order.notes ? (
          <p className="text-muted-foreground text-sm">Note: {order.notes}</p>
        ) : null}
        <div className="flex justify-between border-t pt-3 text-sm font-semibold">
          <span>Total</span>
          <span className="tabular-nums">
            {formatMenuPrice(String(order.total), order.currency)}
          </span>
        </div>
      </section>
    </div>
  );
}
