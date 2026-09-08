"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatHour } from "@/features/insights/period";
import type {
  BusinessHighlight,
  CafeInsights,
  InsightNamedMetric,
} from "@/features/insights/types";
import { formatMenuPrice } from "@/features/menu/types";
import { cn } from "@/lib/utils";

function moneyTooltip(currency: string) {
  return function TooltipBody(props: {
    active?: boolean;
    // Recharts v3 payload is readonly; keep the prop loose.
    payload?: ReadonlyArray<{ value?: unknown; name?: unknown }>;
    label?: unknown;
  }) {
    const { active, payload, label } = props;
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-popover text-popover-foreground rounded-md border px-3 py-2 text-xs shadow-sm">
        <p className="font-medium">{String(label ?? "")}</p>
        {payload.map((entry, index) => {
          const name = String(entry.name ?? "");
          const value = Number(entry.value ?? 0);
          return (
            <p key={`${name}-${index}`} className="tabular-nums">
              {name}:{" "}
              {name.toLowerCase().includes("order")
                ? value
                : formatMenuPrice(value.toFixed(2), currency)}
            </p>
          );
        })}
      </div>
    );
  };
}

export function RevenueChart({ insights }: { insights: CafeInsights }) {
  const currency = insights.currency;
  const useHourly = insights.rangeKey === "today" || insights.rangeKey === "yesterday";
  const data = useHourly
    ? insights.hourly.map((row) => ({
        label: formatHour(row.hour),
        revenue: Number(row.revenue),
        orders: row.orders,
      }))
    : insights.daily.map((row) => ({
        label: new Date(`${row.date}T12:00:00Z`).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
        }),
        revenue: Number(row.revenue),
        orders: row.orders,
      }));

  if (!insights.hasCompletedSales) {
    return (
      <EmptyPanel text="No sales yet in this range. Complete an order to see revenue." />
    );
  }

  return (
    <div className="h-64 w-full min-w-0 sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="ordraRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity={0.28} />
              <stop offset="100%" stopColor="hsl(var(--foreground))" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
          <YAxis
            tick={{ fontSize: 11 }}
            width={48}
            tickFormatter={(v) =>
              currency === "INR" ? `₹${Number(v).toFixed(0)}` : String(v)
            }
          />
          <Tooltip content={moneyTooltip(currency) as never} />
          <Area
            type="monotone"
            dataKey="revenue"
            name="Revenue"
            stroke="hsl(var(--foreground))"
            fill="url(#ordraRevenue)"
            strokeWidth={2}
            isAnimationActive
            animationDuration={650}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function OrderPerformanceChart({ insights }: { insights: CafeInsights }) {
  const slices = [
    { name: "Completed", value: insights.status.completed, color: "#059669" },
    { name: "Cancelled", value: insights.status.cancelled, color: "#dc2626" },
    { name: "Active now", value: insights.status.active, color: "#64748b" },
  ].filter((slice) => slice.value > 0);

  if (slices.length === 0) {
    return <EmptyPanel text="No order activity in this range yet." />;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-[11rem_1fr] sm:items-center">
      <div className="mx-auto h-44 w-44">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="name"
              innerRadius={48}
              outerRadius={72}
              paddingAngle={2}
              isAnimationActive
              animationDuration={550}
            >
              {slices.map((slice) => (
                <Cell key={slice.name} fill={slice.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="space-y-2 text-sm">
        {slices.map((slice) => (
          <li key={slice.name} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2">
              <span
                className="inline-block size-2.5 rounded-full"
                style={{ background: slice.color }}
                aria-hidden
              />
              {slice.name}
            </span>
            <span className="font-medium tabular-nums">{slice.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PeakHoursChart({ insights }: { insights: CafeInsights }) {
  const data = insights.hourly.map((row) => ({
    label: formatHour(row.hour),
    orders: row.orders,
    revenue: Number(row.revenue),
  }));
  const max = Math.max(...data.map((d) => d.orders), 0);

  if (max === 0) {
    return <EmptyPanel text="Not enough data to identify a peak hour yet." />;
  }

  return (
    <div className="h-56 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            className="stroke-border"
            vertical={false}
          />
          <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={2} />
          <YAxis allowDecimals={false} width={28} tick={{ fontSize: 11 }} />
          <Tooltip content={moneyTooltip(insights.currency) as never} />
          <Bar
            dataKey="orders"
            name="Orders"
            fill="hsl(var(--foreground))"
            radius={[4, 4, 0, 0]}
            isAnimationActive
            animationDuration={550}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function NamedMetricList({
  rows,
  currency,
  empty,
  quantityLabel = "sold",
}: {
  rows: InsightNamedMetric[];
  currency: string;
  empty: string;
  quantityLabel?: string;
}) {
  if (rows.length === 0) return <EmptyPanel text={empty} />;

  return (
    <ul className="divide-y">
      {rows.map((row, index) => (
        <li
          key={`${row.name}-${index}`}
          className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
        >
          <div className="min-w-0">
            <p className="truncate font-medium">
              {index === 0 ? "🔥 " : ""}
              {row.name}
            </p>
            <p className="text-muted-foreground text-xs">
              {row.quantity != null
                ? `${row.quantity} ${quantityLabel}`
                : `${row.orders ?? 0} orders`}
              {row.share != null ? ` · ${row.share}% of revenue` : ""}
            </p>
          </div>
          <p className="shrink-0 text-sm font-semibold tabular-nums">
            {formatMenuPrice(row.revenue, currency)}
          </p>
        </li>
      ))}
    </ul>
  );
}

export function BusinessHighlightsList({ items }: { items: BusinessHighlight[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item, index) => (
        <li
          key={item.id}
          className={cn(
            "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 rounded-lg border px-3 py-2.5 text-sm",
          )}
          style={{ animationDelay: `${index * 60}ms`, animationFillMode: "both" }}
        >
          {item.text}
        </li>
      ))}
    </ul>
  );
}

function EmptyPanel({ text }: { text: string }) {
  return (
    <p className="text-muted-foreground rounded-lg border border-dashed px-4 py-10 text-center text-sm">
      {text}
    </p>
  );
}
