import { Suspense } from "react";
import Link from "next/link";

import { getCafeById } from "@/features/cafes/actions";
import { requireCafeAccess } from "@/features/memberships/access";
import { listCafeOrderHistory } from "@/features/orders/actions";
import { OrderHistoryPanel } from "@/features/orders/components/order-history-panel";

type HistoryPageProps = {
  params: Promise<{ cafeId: string }>;
  searchParams: Promise<{ range?: string; q?: string; page?: string }>;
};

export async function generateMetadata({ params }: HistoryPageProps) {
  const { cafeId } = await params;
  const cafe = await getCafeById(cafeId);
  return {
    title: cafe ? `Order history · ${cafe.name}` : "Order history · Ordra",
    robots: { index: false, follow: false },
  };
}

export default async function OrderHistoryPage({
  params,
  searchParams,
}: HistoryPageProps) {
  const { cafeId } = await params;
  const filters = await searchParams;
  await requireCafeAccess(cafeId);

  const range =
    filters.range === "yesterday" ||
    filters.range === "7d" ||
    filters.range === "all" ||
    filters.range === "today"
      ? filters.range
      : "today";
  const page = Math.max(1, Number.parseInt(filters.page ?? "1", 10) || 1);
  const q = filters.q?.trim() ?? "";

  const [cafe, history] = await Promise.all([
    getCafeById(cafeId),
    listCafeOrderHistory(cafeId, { range, q, page }),
  ]);

  return (
    <main className="space-y-6">
      <div className="space-y-2">
        <p className="text-muted-foreground text-sm">
          <Link
            href={`/dashboard/cafes/${cafeId}/orders`}
            className="hover:text-foreground underline-offset-4 hover:underline"
          >
            ← Orders
          </Link>
        </p>
        <h2 className="text-2xl font-semibold tracking-tight">Order history</h2>
        <p className="text-muted-foreground text-sm">
          Completed and cancelled orders. No analytics — just a clean record.
        </p>
      </div>

      <Suspense fallback={<p className="text-muted-foreground text-sm">Loading…</p>}>
        <OrderHistoryPanel
          cafeId={cafeId}
          currency={cafe?.currency ?? "INR"}
          orders={history.orders}
          page={history.page}
          hasMore={history.hasMore}
          range={range}
          q={q}
        />
      </Suspense>
    </main>
  );
}
