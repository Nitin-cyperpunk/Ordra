import Link from "next/link";

import { GuestCreateInvoiceButton } from "@/features/billing/components/guest-create-invoice-button";
import { canCreateInvoice } from "@/features/billing/invoice-logic";
import {
  formatOrderNumber,
  GUEST_TRACK_LABELS,
  type GuestOrderView,
  type OrderStatus,
} from "@/features/orders/types";
import { formatMenuPrice } from "@/features/menu/types";
import { ThemeToggle } from "@/components/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
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

export function GuestOrderTracker({
  order,
  invoiceHref,
  hasInvoice = false,
}: {
  order: GuestOrderView;
  invoiceHref: string;
  hasInvoice?: boolean;
}) {
  const menuHref = order.cafe_slug ? `/c/${encodeURIComponent(order.cafe_slug)}` : null;
  const justPlaced = order.status === "pending";

  return (
    <div className="mx-auto w-full max-w-lg space-y-8 px-4 py-8 sm:px-6">
      <header className="space-y-2 border-b pb-6">
        <p className="text-muted-foreground text-xs font-medium uppercase tracking-[0.2em]">
          {justPlaced ? "Order placed successfully" : "Track order"}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          {formatOrderNumber(order.order_number)}
        </h1>
        <p className="text-muted-foreground text-sm">
          {order.cafe_name}
          {order.table_code ? ` · Table ${order.table_code}` : ""}
        </p>
        <p className="text-sm font-medium" aria-live="polite">
          {GUEST_TRACK_LABELS[order.status]}
        </p>
      </header>

      {order.status === "rejected" ? (
        <p className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border px-3 py-2 text-sm">
          Order cancelled. You can place a new order from the menu.
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
                  {GUEST_TRACK_LABELS[step]}
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

      {canCreateInvoice(order.status) ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Invoice</h2>
          {hasInvoice ? (
            <Link href={invoiceHref} className={cn(buttonVariants(), "min-h-12")}>
              View Invoice
            </Link>
          ) : (
            <GuestCreateInvoiceButton
              publicToken={order.public_token}
              successHref={invoiceHref}
              cafeName={order.cafe_name}
              currency={order.currency}
              total={String(order.total)}
              items={order.items.map((item) => ({
                id: item.id,
                name: item.name,
                quantity: item.quantity,
                unit_price: item.price,
                line_total: String(item.line_total),
              }))}
            />
          )}
        </section>
      ) : null}

      {menuHref ? (
        <div className="flex flex-col gap-2">
          <Link
            href={menuHref}
            className={cn(buttonVariants({ variant: "outline" }), "min-h-12")}
          >
            Back to menu
          </Link>
        </div>
      ) : null}

      <div className="flex justify-center">
        <ThemeToggle />
      </div>
    </div>
  );
}
