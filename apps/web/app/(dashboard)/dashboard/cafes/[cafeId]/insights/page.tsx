import { Suspense } from "react";

import { getCafeById } from "@/features/cafes/actions";
import { getCafeInsights } from "@/features/insights/actions";
import { InsightsDashboard } from "@/features/insights/components/insights-dashboard";
import { isInsightRangeKey } from "@/features/insights/period";
import { requireCafeAccess } from "@/features/memberships/access";
import { EmptyState } from "@/components/empty-state";

type InsightsPageProps = {
  params: Promise<{ cafeId: string }>;
  searchParams: Promise<{ range?: string; from?: string; to?: string }>;
};

export async function generateMetadata({ params }: InsightsPageProps) {
  const { cafeId } = await params;
  const cafe = await getCafeById(cafeId);
  return {
    title: cafe ? `Insights · ${cafe.name}` : "Insights · Ordra",
    robots: { index: false, follow: false },
  };
}

export default async function CafeInsightsPage({
  params,
  searchParams,
}: InsightsPageProps) {
  const { cafeId } = await params;
  const filters = await searchParams;
  await requireCafeAccess(cafeId);
  const cafe = await getCafeById(cafeId);

  const range = isInsightRangeKey(filters.range) ? filters.range : "today";

  let insights = null;
  let errorMessage: string | null = null;
  try {
    insights = await getCafeInsights(cafeId, {
      range,
      from: filters.from,
      to: filters.to,
    });
  } catch (error) {
    errorMessage =
      error instanceof Error
        ? error.message
        : "We couldn’t load your analytics right now. Please try again.";
  }

  if (errorMessage || !insights || !cafe) {
    return (
      <main className="space-y-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">Insights</h2>
          <p className="text-muted-foreground text-sm">
            Business performance from completed orders.
          </p>
        </div>
        <EmptyState
          title="Couldn’t load insights"
          description={errorMessage ?? "Please try again in a moment."}
          actionLabel="Back to home"
          actionHref={`/dashboard/cafes/${cafeId}`}
        />
      </main>
    );
  }

  return (
    <main>
      <Suspense fallback={<InsightsSkeleton />}>
        <InsightsDashboard
          cafeId={cafeId}
          cafeName={cafe.name}
          insights={insights}
          customFrom={filters.from}
          customTo={filters.to}
        />
      </Suspense>
    </main>
  );
}

function InsightsSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <div className="space-y-2">
        <div className="bg-muted h-4 w-32 animate-pulse rounded" />
        <div className="bg-muted h-8 w-72 max-w-full animate-pulse rounded" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="bg-muted/40 h-28 animate-pulse rounded-xl border" />
        ))}
      </div>
      <div className="bg-muted/30 h-72 animate-pulse rounded-2xl border" />
    </div>
  );
}
