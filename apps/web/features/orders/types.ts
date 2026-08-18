export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "completed",
  "rejected",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** Customer-facing labels (Module 11 tracker). */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Waiting for cafe",
  confirmed: "Confirmed",
  preparing: "Preparing",
  ready: "Ready",
  completed: "Completed",
  rejected: "Cancelled",
};

/** Staff / kitchen board column titles. */
export const ORDER_OPS_LABELS: Record<OrderStatus, string> = {
  pending: "New",
  confirmed: "Accepted",
  preparing: "Preparing",
  ready: "Ready",
  completed: "Completed",
  rejected: "Cancelled",
};

export const ACTIVE_ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
];

export const HISTORY_ORDER_STATUSES: OrderStatus[] = ["completed", "rejected"];

/** Valid staff transitions (mirrors DB RPC). */
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "rejected"],
  confirmed: ["preparing"],
  preparing: ["ready"],
  ready: ["completed"],
  completed: [],
  rejected: [],
};

export type CafeOrderLineSummary = {
  name: string;
  quantity: number;
};

export type CafeOrder = {
  id: string;
  cafe_id: string;
  table_id: string;
  order_number: number;
  status: OrderStatus;
  subtotal: string;
  total: string;
  notes: string | null;
  rejection_reason?: string | null;
  created_at: string;
  updated_at: string;
  confirmed_at?: string | null;
  preparing_at?: string | null;
  ready_at?: string | null;
  completed_at?: string | null;
  rejected_at?: string | null;
  table_code?: string | null;
  item_count?: number;
  lines?: CafeOrderLineSummary[];
};

export type CafeOrderItem = {
  id: string;
  order_id: string;
  menu_item_id: string | null;
  item_name_snapshot: string;
  item_price_snapshot: string;
  quantity: number;
  line_total: string;
  notes: string | null;
};

export type OrderStatusHistoryEntry = {
  id: string;
  order_id: string;
  old_status: OrderStatus | null;
  new_status: OrderStatus;
  changed_by: string | null;
  note: string | null;
  created_at: string;
};

export type GuestOrderView = {
  public_token: string;
  order_number: number;
  status: OrderStatus;
  subtotal: string;
  total: string;
  notes: string | null;
  created_at: string;
  cafe_name: string;
  cafe_slug: string | null;
  table_code: string;
  currency: string;
  items: Array<{
    id: string;
    name: string;
    price: string;
    quantity: number;
    line_total: string;
  }>;
};

/** Customer-facing tracker labels. Status values stay Module 11/12. */
export const GUEST_TRACK_LABELS: Record<OrderStatus, string> = {
  pending: "Order placed",
  confirmed: "Accepted",
  preparing: "Preparing",
  ready: "Ready",
  completed: "Completed",
  rejected: "Cancelled",
};

export function formatOrderNumber(orderNumber: number): string {
  return `#${orderNumber}`;
}

export function nextOrderActions(status: OrderStatus): Array<{
  status: OrderStatus;
  label: string;
  variant?: "default" | "destructive" | "outline";
  needsReason?: boolean;
}> {
  switch (status) {
    case "pending":
      return [
        { status: "confirmed", label: "Accept order" },
        {
          status: "rejected",
          label: "Cancel",
          variant: "destructive",
          needsReason: true,
        },
      ];
    case "confirmed":
      return [{ status: "preparing", label: "Start preparing" }];
    case "preparing":
      return [{ status: "ready", label: "Mark ready" }];
    case "ready":
      return [{ status: "completed", label: "Complete" }];
    default:
      return [];
  }
}

/** Minutes since ISO timestamp (floor). */
export function orderAgeMinutes(iso: string, nowMs = Date.now()): number {
  return Math.max(0, Math.floor((nowMs - new Date(iso).getTime()) / 60000));
}

export function formatOrderAge(iso: string, nowMs = Date.now()): string {
  const mins = orderAgeMinutes(iso, nowMs);
  if (mins < 1) return "Just now";
  if (mins === 1) return "1 min";
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  const rem = mins % 60;
  if (hours === 1 && rem === 0) return "1 hr";
  if (rem === 0) return `${hours} hr`;
  return `${hours}h ${rem}m`;
}

/** Soft urgency for waiting time — not rainbow UI. */
export function orderAgeUrgency(
  iso: string,
  nowMs = Date.now(),
): "fresh" | "aging" | "stale" {
  const mins = orderAgeMinutes(iso, nowMs);
  if (mins >= 15) return "stale";
  if (mins >= 8) return "aging";
  return "fresh";
}
