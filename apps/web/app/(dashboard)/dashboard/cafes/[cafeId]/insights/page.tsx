import Link from "next/link";

import { getCafeById } from "@/features/cafes/actions";
import { requireCafeAccess } from "@/features/memberships/access";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";

type InsightsPageProps = {
  params: Promise<{ cafeId: string }>;
};

export async function generateMetadata({ params }: InsightsPageProps) {
  const { cafeId } = await params;
  const cafe = await getCafeById(cafeId);
  return {
    title: cafe ? `Insights · ${cafe.name}` : "Insights · Ordra",
    robots: { index: false, follow: false },
  };
}

export default async function CafeInsightsPage({ params }: InsightsPageProps) {
  const { cafeId } = await params;
  await requireCafeAccess(cafeId);

  return (
    <main className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight">Insights</h2>
        <p className="text-muted-foreground text-sm">
          Simple sales and popularity insights will appear here after orders go live.
        </p>
      </div>

      <EmptyState
        title="Insights are coming soon"
        description="We’ll show what’s selling, quiet hours, and what needs attention — without overwhelming charts."
        actionLabel="Back to home"
        actionHref={`/dashboard/cafes/${cafeId}`}
      />

      <Button asChild variant="outline" className="min-h-11">
        <Link href={`/dashboard/cafes/${cafeId}/menu`}>Review menu</Link>
      </Button>
    </main>
  );
}
