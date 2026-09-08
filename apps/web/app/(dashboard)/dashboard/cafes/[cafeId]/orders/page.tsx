import Link from "next/link";

import { getCafeById } from "@/features/cafes/actions";
import { requireCafeAccess } from "@/features/memberships/access";
import { listActiveCafeOrders } from "@/features/orders/actions";
import { CafeOrdersBoard } from "@/features/orders/components/cafe-orders-board";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type OrdersPageProps = {
  params: Promise<{ cafeId: string }>;
};

export async function generateMetadata({ params }: OrdersPageProps) {
  const { cafeId } = await params;
  const cafe = await getCafeById(cafeId);
  return {
    title: cafe ? `Orders · ${cafe.name}` : "Orders · Ordra",
    robots: { index: false, follow: false },
  };
}

export default async function CafeOrdersPage({ params }: OrdersPageProps) {
  const { cafeId } = await params;
  await requireCafeAccess(cafeId);
  const [cafe, orders] = await Promise.all([
    getCafeById(cafeId),
    listActiveCafeOrders(cafeId),
  ]);

  return (
    <main className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">Orders</h2>
          <p className="text-muted-foreground text-sm">
            See what’s new, what’s cooking, and what’s ready — without digging into each
            ticket.
          </p>
        </div>
        <Link
          href={`/dashboard/cafes/${cafeId}/kitchen`}
          className={cn(buttonVariants({ variant: "secondary" }), "min-h-11")}
        >
          Open kitchen mode
        </Link>
      </div>

      <CafeOrdersBoard
        cafeId={cafeId}
        currency={cafe?.currency ?? "INR"}
        orders={orders}
      />
    </main>
  );
}
