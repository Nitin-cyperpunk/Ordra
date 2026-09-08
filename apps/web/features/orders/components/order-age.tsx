"use client";

import { useEffect, useState } from "react";

import { formatOrderAge, orderAgeUrgency } from "@/features/orders/types";
import { cn } from "@/lib/utils";

/** Client-only elapsed timer — does not hit the server. */
export function OrderAge({
  createdAt,
  className,
  label = "Waiting",
}: {
  createdAt: string;
  className?: string;
  label?: string;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const urgency = orderAgeUrgency(createdAt, now);
  const age = formatOrderAge(createdAt, now);

  return (
    <span
      className={cn(
        "text-xs tabular-nums",
        urgency === "fresh" && "text-muted-foreground",
        urgency === "aging" && "text-amber-700 dark:text-amber-400",
        urgency === "stale" && "text-destructive font-medium",
        className,
      )}
      title={`${label}: ${age}`}
    >
      {label}: {age}
    </span>
  );
}
