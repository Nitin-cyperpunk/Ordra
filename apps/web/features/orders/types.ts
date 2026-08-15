export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "completed",
  "rejected",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Waiting for cafe",
  confirmed: "Confirmed",
  preparing: "Preparing",
  ready: "Ready",
  completed: "Completed",
  rejected: "Rejected",
};

/** Valid staff transitions. */
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "rejected"],
  confirmed: ["preparing"],
  preparing: ["ready"],
  ready: ["completed"],
  completed: [],
  rejected: [],
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
  created_at: string;
  updated_at: string;
  table_code?: string | null;
  item_count?: number;
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

export type GuestOrderView = {
  public_token: string;
  order_number: number;
  status: OrderStatus;
  subtotal: string;
  total: string;
  notes: string | null;
  created_at: string;
  cafe_name: string;
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

export function formatOrderNumber(orderNumber: number): string {
  return `#${orderNumber}`;
}

export function nextOrderActions(status: OrderStatus): Array<{
  status: OrderStatus;
  label: string;
  variant?: "default" | "destructive" | "outline";
}> {
  switch (status) {
    case "pending":
      return [
        { status: "confirmed", label: "Confirm" },
        { status: "rejected", label: "Reject", variant: "destructive" },
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
