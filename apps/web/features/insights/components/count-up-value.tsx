"use client";

import { useEffect, useState } from "react";

import { prefersReducedMotion } from "@/features/billing/invoice-logic";
import { cn } from "@/lib/utils";

type CountUpProps = {
  value: number;
  format: (n: number) => string;
  className?: string;
  durationMs?: number;
};

export function CountUpValue({
  value,
  format,
  className,
  durationMs = 700,
}: CountUpProps) {
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setDisplay(value);
      return;
    }

    let frame = 0;
    const start = performance.now();
    const from = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(from + (value - from) * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, durationMs]);

  return <span className={cn(className)}>{format(display)}</span>;
}
