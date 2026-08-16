import Link from "next/link";
import { notFound } from "next/navigation";

import { getCafeById } from "@/features/cafes/actions";
import { requireCafeAccess } from "@/features/memberships/access";
import {
  getCafeOrderDetail,
  getOrderStatusHistory,
  transitionOrderAction,
} from "@/features/orders/actions";
import { OrderDetailActions } from "@/features/orders/components/order-detail-actions";
import { OrderStatusTimeline } from "@/features/orders/components/order-status-timeline";
import {
  formatOrderNumber,
  nextOrderActions,
  ORDER_OPS_LABELS,
} from "@/features/orders/types";
import { formatMenuPrice } from "@/features/menu/types";

type OrderDetailPageProps = {
  params: Promise<{ cafeId: string; orderId: string }>;
};

export async function generateMetadata({ params }: OrderDetailPageProps) {
  const { cafeId, orderId } = await params;
  const detail = await getCafeOrderDetail(cafeId, orderId);
  return {
    title: detail
      ? `Order ${formatOrderNumber(detail.order.order_number)} · Ordra`
      : "Order · Ordra",
    robots: { index: false, follow: false },
  };
}

export default async function CafeOrderDetailPage({ params }: OrderDetailPageProps) {
  const { cafeId, orderId } = await params;
  await requireCafeAccess(cafeId);
  const [cafe, detail, history] = await Promise.all([
    getCafeById(cafeId),
    getCafeOrderDetail(cafeId, orderId),
    getOrderStatusHistory(cafeId, orderId),
  ]);

  if (!detail) notFound();

  const { order, items } = detail;
  const currency = cafe?.currency ?? "INR";
  const actions = nextOrderActions(order.status);

  return (
    <main className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-2">
        <p className="text-muted-foreground text-sm">
          <Link
            href={`/dashboard/cafes/${cafeId}/orders`}
            className="hover:text-foreground underline-offset-4 hover:underline"
          >
            ← Orders
          </Link>
        </p>
        <h2 className="text-2xl font-semibold tracking-tight">
          {formatOrderNumber(order.order_number)}
        </h2>
        <p className="text-muted-foreground text-sm">
          Table {order.table_code ?? "—"} · {ORDER_OPS_LABELS[order.status]}
        </p>
        <p className="text-muted-foreground text-xs">
          Placed {new Date(order.created_at).toLocaleString()}
        </p>
      </div>

      <ul className="space-y-2 rounded-xl border p-4">
        {items.map((item) => (
          <li key={item.id} className="flex justify-between gap-3 text-sm">
            <span>
              {item.quantity} × {item.item_name_snapshot}
            </span>
            <span className="tabular-nums">
              {formatMenuPrice(item.line_total, currency)}
            </span>
          </li>
        ))}
      </ul>

      {order.notes ? (
        <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-sm">
          <span className="font-medium">Note:</span> {order.notes}
        </p>
      ) : null}

      {order.rejection_reason ? (
        <p className="text-sm">
          <span className="font-medium">Cancel reason:</span> {order.rejection_reason}
        </p>
      ) : null}

      <div className="flex justify-between border-t pt-4 text-sm font-semibold">
        <span>Total</span>
        <span className="tabular-nums">{formatMenuPrice(order.total, currency)}</span>
      </div>

      <OrderDetailActions
        cafeId={cafeId}
        orderId={order.id}
        actions={actions}
        action={transitionOrderAction}
      />

      <section className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide">Timeline</h3>
        <OrderStatusTimeline entries={history} />
      </section>
    </main>
  );
}
