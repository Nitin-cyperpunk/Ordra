import { Suspense } from "react";
import Link from "next/link";

import { listCafeInvoices } from "@/features/billing/actions";
import { InvoiceHistoryPanel } from "@/features/billing/components/invoice-history-panel";
import { getCafeById } from "@/features/cafes/actions";
import { requireCafeAccess } from "@/features/memberships/access";

type BillingPageProps = {
  params: Promise<{ cafeId: string }>;
  searchParams: Promise<{ range?: string; q?: string; page?: string }>;
};

export async function generateMetadata({ params }: BillingPageProps) {
  const { cafeId } = await params;
  const cafe = await getCafeById(cafeId);
  return {
    title: cafe ? `Billing · ${cafe.name}` : "Billing · Ordra",
    robots: { index: false, follow: false },
  };
}

export default async function CafeBillingPage({
  params,
  searchParams,
}: BillingPageProps) {
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
    listCafeInvoices(cafeId, { range, q, page }),
  ]);

  return (
    <main className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">Billing</h2>
        <p className="text-muted-foreground text-sm">
          Invoices generated from completed orders. One order, one bill.
        </p>
        <p className="text-muted-foreground text-sm">
          <Link
            href={`/dashboard/cafes/${cafeId}/orders/history`}
            className="hover:text-foreground underline-offset-4 hover:underline"
          >
            Order history
          </Link>
        </p>
      </div>

      <Suspense fallback={<p className="text-muted-foreground text-sm">Loading…</p>}>
        <InvoiceHistoryPanel
          cafeId={cafeId}
          currency={cafe?.currency ?? "INR"}
          invoices={history.invoices}
          page={history.page}
          hasMore={history.hasMore}
          range={range}
          q={q}
        />
      </Suspense>
    </main>
  );
}
