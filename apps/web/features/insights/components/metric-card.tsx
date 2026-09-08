"use client";

import { CountUpValue } from "@/features/insights/components/count-up-value";
import type { InsightDelta } from "@/features/insights/types";
import { cn } from "@/lib/utils";

type MetricCardProps = {
  label: string;
  value: number;
  format: (n: number) => string;
  hint?: string;
  delta?: InsightDelta;
};

export function MetricCard({ label, value, format, hint, delta }: MetricCardProps) {
  return (
    <article className="bg-card hover:border-foreground/15 rounded-xl border p-4 transition-colors">
      <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">
        <CountUpValue value={value} format={format} />
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
        {delta ? (
          <span
            className={cn(
              "font-medium",
              delta.kind === "up" && "text-emerald-600 dark:text-emerald-400",
              delta.kind === "down" && "text-destructive",
              (delta.kind === "flat" || delta.kind === "none") && "text-muted-foreground",
              delta.kind === "new" && "text-foreground",
            )}
          >
            {delta.label}
          </span>
        ) : null}
        {hint ? <span className="text-muted-foreground">{hint}</span> : null}
      </div>
    </article>
  );
}
