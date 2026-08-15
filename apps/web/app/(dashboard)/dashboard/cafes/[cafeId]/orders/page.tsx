import Link from "next/link";

import { getCafeById } from "@/features/cafes/actions";
import { requireCafeAccess } from "@/features/memberships/access";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";

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

  return (
    <main className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight">Orders</h2>
        <p className="text-muted-foreground text-sm">
          Live order taking arrives in a future update. For now, keep your menu and tables
          ready.
        </p>
      </div>

      <EmptyState
        title="Orders are coming soon"
        description="When orders launch, you’ll see today’s tickets here. Get your menu and tables set up so you’re ready."
        actionLabel="Go to menu"
        actionHref={`/dashboard/cafes/${cafeId}/menu`}
        secondaryLabel="Manage tables"
        secondaryHref={`/dashboard/cafes/${cafeId}/tables`}
      />

      <Button asChild variant="outline" className="min-h-11">
        <Link href={`/dashboard/cafes/${cafeId}`}>Back to home</Link>
      </Button>
    </main>
  );
}
