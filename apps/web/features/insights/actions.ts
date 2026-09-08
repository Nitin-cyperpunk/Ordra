"use server";

import { mapInsightsError } from "@/features/insights/errors";
import {
  isInsightRangeKey,
  mapPeriodTotals,
  normalizeInsightMoney,
  resolveInsightPeriod,
  withShare,
} from "@/features/insights/period";
import type {
  CafeInsights,
  InsightDayBucket,
  InsightHourBucket,
  InsightNamedMetric,
  InsightRangeKey,
  InsightStatusCounts,
} from "@/features/insights/types";
import { getCafeById } from "@/features/cafes/actions";
import { requireCafeAccess } from "@/features/memberships/access";
import { createClient } from "@/lib/supabase/server";

export type InsightsQuery = {
  range?: string;
  from?: string;
  to?: string;
};

function mapNamedRows(raw: unknown): InsightNamedMetric[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((entry) => {
    const row = entry as Record<string, unknown>;
    return {
      name: String(row.name ?? row.table_code ?? "Unknown"),
      quantity: row.quantity != null ? Number(row.quantity) || 0 : undefined,
      orders: row.orders != null ? Number(row.orders) || 0 : undefined,
      revenue: normalizeInsightMoney(row.revenue),
    };
  });
}

function mapHourly(raw: unknown): InsightHourBucket[] {
  if (!Array.isArray(raw)) return [];
  const byHour = new Map<number, InsightHourBucket>();
  for (const entry of raw) {
    const row = entry as Record<string, unknown>;
    const hour = Number(row.hour);
    if (!Number.isFinite(hour)) continue;
    byHour.set(hour, {
      hour,
      orders: Number(row.orders ?? 0) || 0,
      revenue: normalizeInsightMoney(row.revenue),
    });
  }
  return Array.from(
    { length: 24 },
    (_, hour) =>
      byHour.get(hour) ?? {
        hour,
        orders: 0,
        revenue: "0.00",
      },
  );
}

function mapDaily(raw: unknown): InsightDayBucket[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((entry) => {
    const row = entry as Record<string, unknown>;
    return {
      date: String(row.date).slice(0, 10),
      orders: Number(row.orders ?? 0) || 0,
      revenue: normalizeInsightMoney(row.revenue),
    };
  });
}

export async function getCafeInsights(
  cafeId: string,
  query: InsightsQuery = {},
): Promise<CafeInsights> {
  await requireCafeAccess(cafeId);
  const cafe = await getCafeById(cafeId);
  const timeZone = cafe?.timezone ?? "Asia/Kolkata";
  const currency = cafe?.currency ?? "INR";

  const rangeKey: InsightRangeKey = isInsightRangeKey(query.range)
    ? query.range
    : "today";
  const period = resolveInsightPeriod(rangeKey, timeZone, new Date(), {
    from: query.from ?? "",
    to: query.to ?? "",
  });

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_cafe_insights", {
    p_cafe_id: cafeId,
    p_from: period.from.toISOString(),
    p_to: period.to.toISOString(),
    p_prev_from: period.prevFrom.toISOString(),
    p_prev_to: period.prevTo.toISOString(),
  });

  if (error || !data) {
    throw new Error(mapInsightsError(error?.message));
  }

  const payload = data as Record<string, unknown>;
  const current = mapPeriodTotals(payload.current as Record<string, unknown>);
  const previous = mapPeriodTotals(payload.previous as Record<string, unknown>);
  const statusRaw = (payload.status as Record<string, unknown>) ?? {};
  const status: InsightStatusCounts = {
    completed: Number(statusRaw.completed ?? 0) || 0,
    cancelled: Number(statusRaw.cancelled ?? 0) || 0,
    active: Number(statusRaw.active ?? 0) || 0,
  };

  const revenueTotal = Number.parseFloat(current.revenue) || 0;
  const topItems = withShare(mapNamedRows(payload.top_items), revenueTotal);
  const categories = withShare(mapNamedRows(payload.categories), revenueTotal);
  const tables = withShare(mapNamedRows(payload.tables), revenueTotal);

  return {
    timezone: String(payload.timezone ?? timeZone),
    currency: String(payload.currency ?? currency),
    rangeKey,
    range: {
      from: period.from.toISOString(),
      to: period.to.toISOString(),
      prev_from: period.prevFrom.toISOString(),
      prev_to: period.prevTo.toISOString(),
    },
    current,
    previous,
    status,
    hourly: mapHourly(payload.hourly),
    daily: mapDaily(payload.daily),
    top_items: topItems,
    categories,
    tables,
    hasCompletedSales: current.orders > 0 || Number.parseFloat(current.revenue) > 0,
  };
}

/** Lightweight today snapshot for cafe home cards. */
export async function getCafeTodaySnapshot(cafeId: string): Promise<{
  revenue: string;
  orders: number;
  currency: string;
} | null> {
  try {
    const insights = await getCafeInsights(cafeId, { range: "today" });
    return {
      revenue: insights.current.revenue,
      orders: insights.current.orders,
      currency: insights.currency,
    };
  } catch {
    return null;
  }
}
