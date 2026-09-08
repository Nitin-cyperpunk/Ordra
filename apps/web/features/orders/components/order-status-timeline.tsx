import { ORDER_OPS_LABELS, type OrderStatusHistoryEntry } from "@/features/orders/types";

export function OrderStatusTimeline({ entries }: { entries: OrderStatusHistoryEntry[] }) {
  if (entries.length === 0) {
    return <p className="text-muted-foreground text-sm">No status history yet.</p>;
  }

  return (
    <ol className="space-y-3 border-l pl-4">
      {entries.map((entry) => (
        <li key={entry.id} className="relative">
          <span
            className="bg-foreground absolute -left-[1.3rem] top-1.5 size-2 rounded-full"
            aria-hidden
          />
          <p className="text-sm font-medium">{ORDER_OPS_LABELS[entry.new_status]}</p>
          <p className="text-muted-foreground text-xs">
            {new Date(entry.created_at).toLocaleString()}
            {entry.note ? ` · ${entry.note}` : ""}
          </p>
        </li>
      ))}
    </ol>
  );
}
