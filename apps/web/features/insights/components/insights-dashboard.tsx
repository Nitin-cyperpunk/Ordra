"use client";

import { Suspense, type ReactNode } from "react";

import { BusinessHighlightsList } from "@/features/insights/components/insights-charts";
import {
  NamedMetricList,
  OrderPerformanceChart,
  PeakHoursChart,
  RevenueChart,
} from "@/features/insights/components/insights-charts";
import { DateRangeSelector } from "@/features/insights/components/date-range-selector";
import { MetricCard } from "@/features/insights/components/metric-card";
import {
  buildBusinessHighlights,
  computeDelta,
  moneyNumber,
  peakHourLabel,
} from "@/features/insights/period";
import type { CafeInsights } from "@/features/insights/types";
import { formatMenuPrice } from "@/features/menu/types";

type InsightsDashboardProps = {
  cafeId: string;
  cafeName: string;
  insights: CafeInsights;
  customFrom?: string;
  customTo?: string;
};

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-2xl border p-4 sm:p-5">
      <div className="space-y-1">
        <h3 className="text-base font-semibold tracking-tight">{title}</h3>
        {description ? (
          <p className="text-muted-foreground text-sm">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function InsightsDashboard({
  cafeId,
  cafeName,
  insights,
  customFrom,
  customTo,
}: InsightsDashboardProps) {
  const currency = insights.currency;
  const highlights = buildBusinessHighlights(insights);
  const peak = peakHourLabel(insights.hourly);
  const avgOrdersPerDay =
    insights.daily.length > 0
      ? insights.current.orders / insights.daily.length
      : insights.current.orders;

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="space-y-1">
          <p className="text-muted-foreground text-sm">Ordra Analytics</p>
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            How {cafeName} is performing
          </h2>
          <p className="text-muted-foreground text-sm">
            Completed-order sales only. Times use {insights.timezone}.
          </p>
        </div>
        <Suspense
          fallback={<p className="text-muted-foreground text-sm">Loading filters…</p>}
        >
          <DateRangeSelector
            cafeId={cafeId}
            rangeKey={insights.rangeKey}
            customFrom={customFrom}
            customTo={customTo}
          />
        </Suspense>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Revenue"
          value={moneyNumber(insights.current.revenue)}
          format={(n) => formatMenuPrice(n.toFixed(2), currency)}
          delta={computeDelta(
            moneyNumber(insights.current.revenue),
            moneyNumber(insights.previous.revenue),
          )}
          hint="vs previous period"
        />
        <MetricCard
          label="Completed orders"
          value={insights.current.orders}
          format={(n) => String(Math.round(n))}
          delta={computeDelta(insights.current.orders, insights.previous.orders)}
          hint="Cancelled excluded"
        />
        <MetricCard
          label="Average order value"
          value={moneyNumber(insights.current.aov)}
          format={(n) => formatMenuPrice(n.toFixed(2), currency)}
          delta={computeDelta(
            moneyNumber(insights.current.aov),
            moneyNumber(insights.previous.aov),
          )}
        />
        <MetricCard
          label="Guest sessions"
          value={insights.current.sessions}
          format={(n) => String(Math.round(n))}
          delta={computeDelta(insights.current.sessions, insights.previous.sessions)}
          hint="Cookie-based guests, not CRM profiles"
        />
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Section
          title="Revenue performance"
          description="Completed sales over the selected range."
        >
          <RevenueChart insights={insights} />
        </Section>
        <Section
          title="Order mix"
          description="Completed, cancelled, and currently active."
        >
          <OrderPerformanceChart insights={insights} />
          <p className="text-muted-foreground text-xs">
            Avg completed orders / day in range:{" "}
            <span className="text-foreground font-medium tabular-nums">
              {avgOrdersPerDay.toFixed(1)}
            </span>
          </p>
        </Section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Popular items" description="From order line snapshots.">
          <NamedMetricList
            rows={insights.top_items}
            currency={currency}
            empty="No item sales in this range yet."
          />
        </Section>
        <Section
          title="Category performance"
          description="Mapped via current menu categories when available."
        >
          <NamedMetricList
            rows={insights.categories}
            currency={currency}
            empty="No category sales in this range yet."
          />
        </Section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section
          title="Peak hours"
          description={
            peak
              ? `Busiest hour: ${peak}.`
              : "Hourly completed-order volume in cafe local time."
          }
        >
          <PeakHoursChart insights={insights} />
        </Section>
        <Section
          title="Guest sessions"
          description="New vs returning guest cookies with completed orders."
        >
          {insights.current.sessions === 0 ? (
            <p className="text-muted-foreground rounded-lg border border-dashed px-4 py-10 text-center text-sm">
              No guest session history in this range yet.
            </p>
          ) : (
            <ul className="space-y-3 text-sm">
              <li className="flex justify-between rounded-lg border px-3 py-3">
                <span>New sessions</span>
                <span className="font-semibold tabular-nums">
                  {insights.current.new_sessions}
                </span>
              </li>
              <li className="flex justify-between rounded-lg border px-3 py-3">
                <span>Returning sessions</span>
                <span className="font-semibold tabular-nums">
                  {insights.current.returning_sessions}
                </span>
              </li>
              <li className="text-muted-foreground text-xs">
                Repeat rate:{" "}
                {insights.current.sessions > 0
                  ? `${Math.round(
                      (insights.current.returning_sessions / insights.current.sessions) *
                        100,
                    )}%`
                  : "—"}
              </li>
            </ul>
          )}
        </Section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Tables" description="Completed revenue by table.">
          <NamedMetricList
            rows={insights.tables}
            currency={currency}
            empty="No table sales in this range yet."
            quantityLabel="orders"
          />
        </Section>
        <Section
          title="Business highlights"
          description="Rule-based observations from this range."
        >
          <BusinessHighlightsList items={highlights} />
        </Section>
      </div>
    </div>
  );
}
