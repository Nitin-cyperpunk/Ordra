import Link from "next/link";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  className?: string;
  children?: ReactNode;
};

/**
 * Friendly empty state for cafe-owner surfaces.
 * Explains what’s missing, why it matters, and the next action.
 */
export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  secondaryLabel,
  secondaryHref,
  className,
  children,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-start gap-4 rounded-xl border border-dashed p-6 sm:p-8",
        className,
      )}
    >
      <div className="space-y-2">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        <p className="text-muted-foreground max-w-md text-sm leading-relaxed">
          {description}
        </p>
      </div>
      {(actionLabel && actionHref) || children ? (
        <div className="flex flex-wrap gap-2">
          {actionLabel && actionHref ? (
            <Button asChild className="min-h-11 px-4">
              <Link href={actionHref}>{actionLabel}</Link>
            </Button>
          ) : null}
          {secondaryLabel && secondaryHref ? (
            <Button asChild variant="outline" className="min-h-11 px-4">
              <Link href={secondaryHref}>{secondaryLabel}</Link>
            </Button>
          ) : null}
          {children}
        </div>
      ) : null}
    </div>
  );
}
