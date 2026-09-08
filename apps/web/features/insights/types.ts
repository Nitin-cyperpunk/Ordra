export const INSIGHT_RANGES = ["today", "yesterday", "7d", "30d", "custom"] as const;

export type InsightRangeKey = (typeof INSIGHT_RANGES)[number];

export type InsightPeriodTotals = {
  revenue: string;
  orders: number;
  sessions: number;
  aov: string;
  new_sessions: number;
  returning_sessions: number;
};

export type InsightStatusCounts = {
  completed: number;
  cancelled: number;
  active: number;
};

export type InsightHourBucket = {
  hour: number;
  orders: number;
  revenue: string;
};

export type InsightDayBucket = {
  date: string;
  orders: number;
  revenue: string;
};

export type InsightNamedMetric = {
  name: string;
  quantity?: number;
  orders?: number;
  revenue: string;
  share?: number;
};

export type CafeInsights = {
  timezone: string;
  currency: string;
  rangeKey: InsightRangeKey;
  range: {
    from: string;
    to: string;
    prev_from: string;
    prev_to: string;
  };
  current: InsightPeriodTotals;
  previous: InsightPeriodTotals;
  status: InsightStatusCounts;
  hourly: InsightHourBucket[];
  daily: InsightDayBucket[];
  top_items: InsightNamedMetric[];
  categories: InsightNamedMetric[];
  tables: InsightNamedMetric[];
  hasCompletedSales: boolean;
};

export type InsightDelta = {
  kind: "up" | "down" | "flat" | "new" | "none";
  label: string;
};

export type BusinessHighlight = {
  id: string;
  text: string;
};
