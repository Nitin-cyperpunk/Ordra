import { getCafeById } from "@/features/cafes/actions";
import { requireCafeAccess } from "@/features/memberships/access";
import { listActiveCafeOrders } from "@/features/orders/actions";
import { KitchenBoard } from "@/features/orders/components/kitchen-board";

type KitchenPageProps = {
  params: Promise<{ cafeId: string }>;
};

export async function generateMetadata({ params }: KitchenPageProps) {
  const { cafeId } = await params;
  const cafe = await getCafeById(cafeId);
  return {
    title: cafe ? `Kitchen · ${cafe.name}` : "Kitchen · Ordra",
    robots: { index: false, follow: false },
  };
}

export default async function KitchenPage({ params }: KitchenPageProps) {
  const { cafeId } = await params;
  await requireCafeAccess(cafeId);
  const [cafe, orders] = await Promise.all([
    getCafeById(cafeId),
    listActiveCafeOrders(cafeId),
  ]);

  return (
    <main className="space-y-2">
      <KitchenBoard
        cafeId={cafeId}
        currency={cafe?.currency ?? "INR"}
        cafeName={cafe?.name ?? "Cafe"}
        orders={orders}
      />
    </main>
  );
}
