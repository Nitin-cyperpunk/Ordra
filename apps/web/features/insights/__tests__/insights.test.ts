import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { mapInsightsError } from "../errors";
import {
  addCalendarDays,
  buildBusinessHighlights,
  computeDelta,
  formatDateInTimeZone,
  formatHour,
  isInsightRangeKey,
  moneyNumber,
  normalizeInsightMoney,
  peakHourLabel,
  resolveInsightPeriod,
  withShare,
  zonedDateTimeToUtc,
} from "../period";
import type { CafeInsights } from "../types";

describe("insight period bounds", () => {
  it("formats cafe-local calendar dates in Asia/Kolkata", () => {
    const utc = new Date("2026-08-18T20:30:00.000Z"); // 02:00 IST next day
    assert.equal(formatDateInTimeZone(utc, "Asia/Kolkata"), "2026-08-19");
  });

  it("builds today vs yesterday bounds in cafe timezone", () => {
    const now = new Date("2026-08-19T08:00:00.000Z"); // 13:30 IST
    const period = resolveInsightPeriod("today", "Asia/Kolkata", now);
    assert.equal(formatDateInTimeZone(period.from, "Asia/Kolkata"), "2026-08-19");
    assert.equal(formatDateInTimeZone(period.prevFrom, "Asia/Kolkata"), "2026-08-18");
    assert.ok(period.from < period.to);
    assert.equal(period.prevTo.getTime(), period.from.getTime());
  });

  it("builds 7d windows of equal length", () => {
    const now = new Date("2026-08-19T08:00:00.000Z");
    const period = resolveInsightPeriod("7d", "Asia/Kolkata", now);
    const ms = period.to.getTime() - period.from.getTime();
    const prevMs = period.prevTo.getTime() - period.prevFrom.getTime();
    assert.equal(ms, prevMs);
    assert.equal(ms, 7 * 86_400_000);
  });

  it("converts cafe-local midnight to a stable UTC instant", () => {
    const utc = zonedDateTimeToUtc("2026-08-19", "00:00:00", "Asia/Kolkata");
    assert.equal(utc.toISOString(), "2026-08-18T18:30:00.000Z");
  });

  it("adds calendar days without DST math surprises on ISO keys", () => {
    assert.equal(addCalendarDays("2026-08-19", -1), "2026-08-18");
    assert.equal(addCalendarDays("2026-03-01", -1), "2026-02-28");
  });
});

describe("insight metric helpers", () => {
  it("normalizes money and computes AOV-safe deltas", () => {
    assert.equal(normalizeInsightMoney(540), "540.00");
    assert.equal(moneyNumber("240.5"), 240.5);
    assert.deepEqual(computeDelta(100, 0), { kind: "new", label: "New" });
    assert.deepEqual(computeDelta(0, 0), { kind: "none", label: "—" });
    assert.equal(computeDelta(110, 100).kind, "up");
    assert.equal(computeDelta(90, 100).kind, "down");
  });

  it("adds share percentages from revenue", () => {
    const rows = withShare(
      [
        { name: "Coffee", revenue: "80.00", quantity: 4 },
        { name: "Tea", revenue: "20.00", quantity: 2 },
      ],
      100,
    );
    assert.equal(rows[0]?.share, 80);
    assert.equal(rows[1]?.share, 20);
  });

  it("finds peak hour labels", () => {
    assert.equal(formatHour(0), "12 AM");
    assert.equal(formatHour(13), "1 PM");
    assert.equal(
      peakHourLabel([
        { hour: 12, orders: 2, revenue: "100.00" },
        { hour: 20, orders: 9, revenue: "900.00" },
      ]),
      "8 PM–9 PM",
    );
    assert.equal(peakHourLabel([]), null);
  });

  it("validates range keys", () => {
    assert.equal(isInsightRangeKey("today"), true);
    assert.equal(isInsightRangeKey("week"), false);
  });
});

describe("business highlights", () => {
  it("returns empty-state copy without inventing sales", () => {
    const insights = {
      hasCompletedSales: false,
      current: {
        revenue: "0.00",
        orders: 0,
        sessions: 0,
        aov: "0.00",
        new_sessions: 0,
        returning_sessions: 0,
      },
      previous: {
        revenue: "0.00",
        orders: 0,
        sessions: 0,
        aov: "0.00",
        new_sessions: 0,
        returning_sessions: 0,
      },
      top_items: [],
      hourly: [],
      daily: [],
    } as unknown as CafeInsights;

    const highlights = buildBusinessHighlights(insights);
    assert.match(highlights[0]?.text ?? "", /first order/i);
  });

  it("mentions top item and peak hour from real aggregates", () => {
    const insights = {
      hasCompletedSales: true,
      current: {
        revenue: "500.00",
        orders: 5,
        sessions: 4,
        aov: "100.00",
        new_sessions: 3,
        returning_sessions: 1,
      },
      previous: {
        revenue: "400.00",
        orders: 4,
        sessions: 3,
        aov: "100.00",
        new_sessions: 2,
        returning_sessions: 1,
      },
      top_items: [{ name: "Cold Coffee", quantity: 8, revenue: "240.00", share: 48 }],
      hourly: [
        { hour: 19, orders: 1, revenue: "50.00" },
        { hour: 20, orders: 4, revenue: "300.00" },
      ],
      daily: [
        { date: "2026-08-18", orders: 2, revenue: "150.00" },
        { date: "2026-08-19", orders: 3, revenue: "350.00" },
      ],
    } as unknown as CafeInsights;

    const text = buildBusinessHighlights(insights)
      .map((h) => h.text)
      .join(" ");
    assert.match(text, /Cold Coffee/);
    assert.match(text, /8 PM–9 PM/);
  });
});

describe("mapInsightsError", () => {
  it("hides raw database errors", () => {
    assert.match(mapInsightsError("permission denied"), /couldn’t load|could not load/i);
    assert.match(mapInsightsError("INSIGHTS_FORBIDDEN"), /access/i);
  });
});
