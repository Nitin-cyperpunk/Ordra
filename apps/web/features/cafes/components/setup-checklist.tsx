import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type SetupChecklistItem = {
  id: string;
  label: string;
  done: boolean;
  href: string;
};

type SetupChecklistProps = {
  cafeId: string;
  items: SetupChecklistItem[];
  dismissed?: boolean;
};

export function SetupChecklist({ cafeId, items }: SetupChecklistProps) {
  const doneCount = items.filter((item) => item.done).length;
  const total = items.length;
  const complete = doneCount === total;
  const progress = total === 0 ? 100 : Math.round((doneCount / total) * 100);

  if (complete) {
    return null;
  }

  return (
    <section className="space-y-4 rounded-xl border p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-base font-semibold tracking-tight">
            Your cafe is almost ready
          </h2>
          <p className="text-muted-foreground text-sm">
            {doneCount} of {total} setup steps done. You can skip anything and come back
            later.
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="min-h-10">
          <Link href={`/dashboard/cafes/${cafeId}`}>Skip for now</Link>
        </Button>
      </div>

      <div
        className="bg-muted h-2 overflow-hidden rounded-full"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Cafe setup progress"
      >
        <div
          className="bg-primary h-full rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={item.href}
              className={cn(
                "hover:bg-accent flex min-h-11 items-center gap-3 rounded-md px-2 py-2 text-sm",
                item.done ? "text-muted-foreground" : "text-foreground font-medium",
              )}
            >
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full border text-xs",
                  item.done
                    ? "text-primary-foreground border-emerald-600 bg-emerald-600"
                    : "border-muted-foreground/40",
                )}
                aria-hidden
              >
                {item.done ? "✓" : ""}
              </span>
              <span className={item.done ? "line-through" : undefined}>{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>

      {items.find((item) => !item.done) ? (
        <Button asChild className="min-h-11 w-full sm:w-auto">
          <Link href={items.find((item) => !item.done)!.href}>Continue setup</Link>
        </Button>
      ) : null}
    </section>
  );
}
