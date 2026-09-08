import type {
  BusinessHighlight,
  CafeInsights,
  InsightDelta,
  InsightHourBucket,
  InsightNamedMetric,
  InsightPeriodTotals,
  InsightRangeKey,
} from "@/features/insights/types";

/** Format a Date as YYYY-MM-DD in a specific IANA timezone. */
export function formatDateInTimeZone(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value ?? "1970";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";
  return `${year}-${month}-${day}`;
}

/**
 * Convert a cafe-local calendar day + wall time into a UTC Date.
 * Uses iterative offset resolution so DST boundaries stay accurate.
 */
export function zonedDateTimeToUtc(
  dateKey: string,
  time: string,
  timeZone: string,
): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  const [hour, minute, second = 0] = time.split(":").map(Number);
  const guess = new Date(Date.UTC(year!, month! - 1, day!, hour!, minute!, second));

  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const read = (value: Date) => {
    const parts = dtf.formatToParts(value);
    const get = (type: Intl.DateTimeFormatPartTypes) =>
      Number(parts.find((part) => part.type === type)?.value ?? "0");
    return Date.UTC(
      get("year"),
      get("month") - 1,
      get("day"),
      get("hour") % 24,
      get("minute"),
      get("second"),
    );
  };

  const asUtc = Date.UTC(year!, month! - 1, day!, hour!, minute!, second);
  const offset = read(guess) - guess.getTime();
  const adjusted = new Date(asUtc - offset);
  const offset2 = read(adjusted) - adjusted.getTime();
  return new Date(asUtc - offset2);
}

export function addCalendarDays(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const utc = new Date(Date.UTC(year!, month! - 1, day! + days));
  return utc.toISOString().slice(0, 10);
}

export type PeriodBounds = {
  from: Date;
  to: Date;
  prevFrom: Date;
  prevTo: Date;
  label: string;
};

export function resolveInsightPeriod(
  rangeKey: InsightRangeKey,
  timeZone: string,
  now = new Date(),
  custom?: { from: string; to: string },
): PeriodBounds {
  const todayKey = formatDateInTimeZone(now, timeZone);

  if (rangeKey === "today") {
    const from = zonedDateTimeToUtc(todayKey, "00:00:00", timeZone);
    const to = zonedDateTimeToUtc(addCalendarDays(todayKey, 1), "00:00:00", timeZone);
    const yesterday = addCalendarDays(todayKey, -1);
    const prevFrom = zonedDateTimeToUtc(yesterday, "00:00:00", timeZone);
    return {
      from,
      to,
      prevFrom,
      prevTo: from,
      label: "Today",
    };
  }

  if (rangeKey === "yesterday") {
    const yesterday = addCalendarDays(todayKey, -1);
    const from = zonedDateTimeToUtc(yesterday, "00:00:00", timeZone);
    const to = zonedDateTimeToUtc(todayKey, "00:00:00", timeZone);
    const dayBefore = addCalendarDays(todayKey, -2);
    const prevFrom = zonedDateTimeToUtc(dayBefore, "00:00:00", timeZone);
    return {
      from,
      to,
      prevFrom,
      prevTo: from,
      label: "Yesterday",
    };
  }

  if (rangeKey === "7d") {
    const startKey = addCalendarDays(todayKey, -6);
    const from = zonedDateTimeToUtc(startKey, "00:00:00", timeZone);
    const to = zonedDateTimeToUtc(addCalendarDays(todayKey, 1), "00:00:00", timeZone);
    const prevStart = addCalendarDays(startKey, -7);
    const prevFrom = zonedDateTimeToUtc(prevStart, "00:00:00", timeZone);
    return {
      from,
      to,
      prevFrom,
      prevTo: from,
      label: "Last 7 days",
    };
  }

  if (rangeKey === "30d") {
    const startKey = addCalendarDays(todayKey, -29);
    const from = zonedDateTimeToUtc(startKey, "00:00:00", timeZone);
    const to = zonedDateTimeToUtc(addCalendarDays(todayKey, 1), "00:00:00", timeZone);
    const prevStart = addCalendarDays(startKey, -30);
    const prevFrom = zonedDateTimeToUtc(prevStart, "00:00:00", timeZone);
    return {
      from,
      to,
      prevFrom,
      prevTo: from,
      label: "Last 30 days",
    };
  }

  // custom
  const fromKey = custom?.from ?? todayKey;
  const toKey = custom?.to ?? todayKey;
  const start = fromKey <= toKey ? fromKey : toKey;
  const end = fromKey <= toKey ? toKey : fromKey;
  const dayCount =
    Math.round(
      (Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86_400_000,
    ) + 1;
  const from = zonedDateTimeToUtc(start, "00:00:00", timeZone);
  const to = zonedDateTimeToUtc(addCalendarDays(end, 1), "00:00:00", timeZone);
  const prevEnd = addCalendarDays(start, -1);
  const prevStart = addCalendarDays(prevEnd, -(dayCount - 1));
  const prevFrom = zonedDateTimeToUtc(prevStart, "00:00:00", timeZone);
  const prevTo = zonedDateTimeToUtc(start, "00:00:00", timeZone);

  return {
    from,
    to,
    prevFrom,
    prevTo,
    label: `${start} → ${end}`,
  };
}

export function normalizeInsightMoney(value: unknown): string {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount)) return "0.00";
  return amount.toFixed(2);
}

export function moneyNumber(value: unknown): number {
  const amount = Number.parseFloat(normalizeInsightMoney(value));
  return Number.isFinite(amount) ? amount : 0;
}

export function computeDelta(current: number, previous: number): InsightDelta {
  if (previous === 0 && current === 0) return { kind: "none", label: "—" };
  if (previous === 0 && current > 0) return { kind: "new", label: "New" };
  if (previous === 0 && current < 0) return { kind: "none", label: "—" };

  const pct = ((current - previous) / Math.abs(previous)) * 100;
  if (!Number.isFinite(pct)) return { kind: "none", label: "—" };
  if (Math.abs(pct) < 0.05) return { kind: "flat", label: "0%" };

  const rounded = Math.abs(pct) >= 10 ? pct.toFixed(0) : pct.toFixed(1);
  if (pct > 0) return { kind: "up", label: `↑ ${rounded}%` };
  return { kind: "down", label: `↓ ${Math.abs(Number(rounded))}%` };
}

export function withShare(
  rows: InsightNamedMetric[],
  totalRevenue: number,
): InsightNamedMetric[] {
  return rows.map((row) => ({
    ...row,
    share:
      totalRevenue > 0
        ? Math.round((moneyNumber(row.revenue) / totalRevenue) * 1000) / 10
        : 0,
  }));
}

export function peakHourLabel(hourly: InsightHourBucket[]): string | null {
  if (hourly.length === 0) return null;
  let best = hourly[0]!;
  for (const bucket of hourly) {
    if (
      bucket.orders > best.orders ||
      (bucket.orders === best.orders &&
        moneyNumber(bucket.revenue) > moneyNumber(best.revenue))
    ) {
      best = bucket;
    }
  }
  if (best.orders <= 0) return null;
  const start = best.hour % 24;
  const end = (start + 1) % 24;
  return `${formatHour(start)}–${formatHour(end)}`;
}

export function formatHour(hour: number): string {
  const h = ((hour % 24) + 24) % 24;
  const suffix = h >= 12 ? "PM" : "AM";
  const twelve = h % 12 === 0 ? 12 : h % 12;
  return `${twelve} ${suffix}`;
}

export function strongestDayLabel(daily: CafeInsights["daily"]): string | null {
  if (daily.length === 0) return null;
  let best = daily[0]!;
  for (const day of daily) {
    if (moneyNumber(day.revenue) > moneyNumber(best.revenue)) best = day;
  }
  if (moneyNumber(best.revenue) <= 0) return null;
  const date = new Date(`${best.date}T12:00:00Z`);
  return date.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });
}

export function buildBusinessHighlights(insights: CafeInsights): BusinessHighlight[] {
  const highlights: BusinessHighlight[] = [];
  const revenueDelta = computeDelta(
    moneyNumber(insights.current.revenue),
    moneyNumber(insights.previous.revenue),
  );
  const aovDelta = computeDelta(
    moneyNumber(insights.current.aov),
    moneyNumber(insights.previous.aov),
  );
  const ordersDelta = computeDelta(insights.current.orders, insights.previous.orders);

  if (!insights.hasCompletedSales) {
    return [
      {
        id: "empty",
        text: "Complete your first order to start seeing business highlights.",
      },
    ];
  }

  if (revenueDelta.kind === "up" || revenueDelta.kind === "down") {
    highlights.push({
      id: "revenue",
      text: `Revenue ${revenueDelta.kind === "up" ? "increased" : "decreased"} ${revenueDelta.label.replace(/^[↑↓]\s*/, "")} vs the previous period.`,
    });
  } else if (revenueDelta.kind === "new") {
    highlights.push({
      id: "revenue-new",
      text: "This is your first completed-sales period in this range.",
    });
  }

  const topItem = insights.top_items[0];
  if (topItem) {
    highlights.push({
      id: "top-item",
      text: `${topItem.name} was your best-selling item (${topItem.quantity ?? 0} sold).`,
    });
  }

  const peak = peakHourLabel(insights.hourly);
  if (peak) {
    highlights.push({
      id: "peak",
      text: `${peak} was your busiest hour.`,
    });
  }

  const strongDay = strongestDayLabel(insights.daily);
  if (strongDay && insights.daily.length > 1) {
    highlights.push({
      id: "day",
      text: `${strongDay} generated your highest revenue in this range.`,
    });
  }

  if (aovDelta.kind === "up" || aovDelta.kind === "down") {
    highlights.push({
      id: "aov",
      text: `Average order value ${aovDelta.kind === "up" ? "increased" : "decreased"} ${aovDelta.label.replace(/^[↑↓]\s*/, "")}.`,
    });
  }

  if (ordersDelta.kind === "up" && highlights.length < 5) {
    highlights.push({
      id: "orders",
      text: `Completed orders rose ${ordersDelta.label.replace(/^[↑↓]\s*/, "")} vs the previous period.`,
    });
  }

  if (highlights.length === 0) {
    highlights.push({
      id: "steady",
      text: "Performance looks steady versus the previous period.",
    });
  }

  return highlights.slice(0, 5);
}

export function emptyPeriodTotals(): InsightPeriodTotals {
  return {
    revenue: "0.00",
    orders: 0,
    sessions: 0,
    aov: "0.00",
    new_sessions: 0,
    returning_sessions: 0,
  };
}

export function mapPeriodTotals(
  raw: Record<string, unknown> | null | undefined,
): InsightPeriodTotals {
  if (!raw) return emptyPeriodTotals();
  return {
    revenue: normalizeInsightMoney(raw.revenue),
    orders: Number(raw.orders ?? 0) || 0,
    sessions: Number(raw.sessions ?? 0) || 0,
    aov: normalizeInsightMoney(raw.aov),
    new_sessions: Number(raw.new_sessions ?? 0) || 0,
    returning_sessions: Number(raw.returning_sessions ?? 0) || 0,
  };
}

export function isInsightRangeKey(
  value: string | undefined | null,
): value is InsightRangeKey {
  return (
    value === "today" ||
    value === "yesterday" ||
    value === "7d" ||
    value === "30d" ||
    value === "custom"
  );
}
