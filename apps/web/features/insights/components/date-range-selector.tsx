"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import type { InsightRangeKey } from "@/features/insights/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const PRESETS: Array<{ key: InsightRangeKey; label: string }> = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
  { key: "custom", label: "Custom" },
];

type DateRangeSelectorProps = {
  cafeId: string;
  rangeKey: InsightRangeKey;
  customFrom?: string;
  customTo?: string;
};

export function DateRangeSelector({
  cafeId,
  rangeKey,
  customFrom = "",
  customTo = "",
}: DateRangeSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, start] = useTransition();

  function push(patch: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (!value) params.delete(key);
      else params.set(key, value);
    }
    start(() => {
      router.push(`/dashboard/cafes/${cafeId}/insights?${params.toString()}`);
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((preset) => (
          <Button
            key={preset.key}
            type="button"
            size="sm"
            variant={rangeKey === preset.key ? "default" : "outline"}
            className="min-h-11"
            disabled={pending}
            onClick={() => {
              if (preset.key === "custom") {
                push({
                  range: "custom",
                  from: customFrom || null,
                  to: customTo || null,
                });
                return;
              }
              push({ range: preset.key, from: null, to: null });
            }}
          >
            {preset.label}
          </Button>
        ))}
      </div>

      {rangeKey === "custom" ? (
        <form
          className={cn("flex flex-wrap items-end gap-2")}
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            push({
              range: "custom",
              from: String(form.get("from") ?? "").trim() || null,
              to: String(form.get("to") ?? "").trim() || null,
            });
          }}
        >
          <label className="space-y-1 text-xs">
            <span className="text-muted-foreground">From</span>
            <Input
              type="date"
              name="from"
              defaultValue={customFrom}
              className="min-h-11 w-auto"
              required
            />
          </label>
          <label className="space-y-1 text-xs">
            <span className="text-muted-foreground">To</span>
            <Input
              type="date"
              name="to"
              defaultValue={customTo}
              className="min-h-11 w-auto"
              required
            />
          </label>
          <Button
            type="submit"
            variant="secondary"
            className="min-h-11"
            disabled={pending}
          >
            Apply
          </Button>
          <Link
            href={`/dashboard/cafes/${cafeId}/insights?range=today`}
            className="text-muted-foreground self-center text-sm underline-offset-4 hover:underline"
          >
            Reset
          </Link>
        </form>
      ) : null}
    </div>
  );
}
