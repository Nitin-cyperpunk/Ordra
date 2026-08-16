import { getCafeById } from "@/features/cafes/actions";
import { requireCafeAccess } from "@/features/memberships/access";
import { listCafeOrders } from "@/features/orders/actions";
import { CafeOrdersBoard } from "@/features/orders/components/cafe-orders-board";

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
  const [cafe, orders] = await Promise.all([getCafeById(cafeId), listCafeOrders(cafeId)]);

  return (
    <main className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight">Orders</h2>
        <p className="text-muted-foreground text-sm">
          Incoming table orders. Confirm, prepare, and mark ready as you go.
        </p>
      </div>

      <CafeOrdersBoard
        cafeId={cafeId}
        currency={cafe?.currency ?? "INR"}
        orders={orders}
      />
    </main>
  );
}
