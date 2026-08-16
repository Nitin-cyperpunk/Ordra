"use server";

import { revalidatePath } from "next/cache";

import { mapOrderError } from "@/features/orders/errors";
import { ensureGuestSessionId, getGuestSessionId } from "@/features/orders/guest-session";
import { placeOrderSchema, transitionOrderSchema } from "@/features/orders/schemas";
import type {
  CafeOrder,
  CafeOrderItem,
  CafeOrderLineSummary,
  GuestOrderView,
  OrderStatus,
  OrderStatusHistoryEntry,
} from "@/features/orders/types";
import { ACTIVE_ORDER_STATUSES, HISTORY_ORDER_STATUSES } from "@/features/orders/types";
import { requireCafeAccess } from "@/features/memberships/access";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type PlaceOrderResult =
  | { ok: true; publicToken: string; orderNumber: number; replayed: boolean }
  | { ok: false; error: string };

const ORDER_LIST_SELECT =
  "id, cafe_id, table_id, order_number, status, subtotal, total, notes, rejection_reason, created_at, updated_at, confirmed_at, preparing_at, ready_at, completed_at, rejected_at, cafe_tables ( code ), order_items ( item_name_snapshot, quantity )" as const;

function mapCafeOrder(row: Record<string, unknown>): CafeOrder {
  const table = row.cafe_tables as { code?: string } | null;
  const rawItems = row.order_items as Array<{
    item_name_snapshot?: string;
    quantity?: number;
  }> | null;
  const lines: CafeOrderLineSummary[] = (rawItems ?? []).map((item) => ({
    name: String(item.item_name_snapshot ?? "Item"),
    quantity: Number(item.quantity ?? 0),
  }));

  return {
    id: String(row.id),
    cafe_id: String(row.cafe_id),
    table_id: String(row.table_id),
    order_number: Number(row.order_number),
    status: row.status as OrderStatus,
    subtotal: String(row.subtotal),
    total: String(row.total),
    notes: (row.notes as string | null) ?? null,
    rejection_reason: (row.rejection_reason as string | null) ?? null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    confirmed_at: (row.confirmed_at as string | null) ?? null,
    preparing_at: (row.preparing_at as string | null) ?? null,
    ready_at: (row.ready_at as string | null) ?? null,
    completed_at: (row.completed_at as string | null) ?? null,
    rejected_at: (row.rejected_at as string | null) ?? null,
    table_code: table?.code ?? null,
    item_count: lines.length,
    lines,
  };
}

function revalidateOrderPaths(cafeId: string, orderId?: string) {
  revalidatePath(`/dashboard/cafes/${cafeId}/orders`);
  revalidatePath(`/dashboard/cafes/${cafeId}/kitchen`);
  revalidatePath(`/dashboard/cafes/${cafeId}/orders/history`);
  if (orderId) {
    revalidatePath(`/dashboard/cafes/${cafeId}/orders/${orderId}`);
  }
}

export async function placeOrderAction(input: unknown): Promise<PlaceOrderResult> {
  const parsed = placeOrderSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please check your cart and try again." };
  }

  const sessionId = await ensureGuestSessionId();
  const admin = createAdminClient();

  const { data, error } = await admin.rpc("place_customer_order", {
    p_cafe_slug: parsed.data.cafeSlug,
    p_table_token: parsed.data.tableToken,
    p_customer_session_id: sessionId,
    p_idempotency_key: parsed.data.idempotencyKey,
    p_notes: parsed.data.notes ?? null,
    p_items: parsed.data.items.map((item) => ({
      menu_item_id: item.menuItemId,
      quantity: item.quantity,
    })),
  });

  if (error) {
    return { ok: false, error: mapOrderError(error.message) };
  }

  const payload = data as {
    public_token: string;
    order_number: number;
    replayed?: boolean;
  };

  return {
    ok: true,
    publicToken: payload.public_token,
    orderNumber: Number(payload.order_number),
    replayed: Boolean(payload.replayed),
  };
}

export async function getGuestOrderByToken(
  publicToken: string,
): Promise<GuestOrderView | null> {
  const sessionId = await getGuestSessionId();
  if (!sessionId) return null;

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("get_customer_order", {
    p_public_token: publicToken,
    p_customer_session_id: sessionId,
  });

  if (error || !data) return null;

  const row = data as Record<string, unknown>;
  const items = Array.isArray(row.items) ? row.items : [];

  return {
    public_token: String(row.public_token),
    order_number: Number(row.order_number),
    status: row.status as OrderStatus,
    subtotal: String(row.subtotal),
    total: String(row.total),
    notes: (row.notes as string | null) ?? null,
    created_at: String(row.created_at),
    cafe_name: String(row.cafe_name ?? ""),
    table_code: String(row.table_code ?? ""),
    currency: String(row.currency ?? "INR"),
    items: items.map((item) => {
      const line = item as Record<string, unknown>;
      return {
        id: String(line.id),
        name: String(line.name),
        price: String(line.price),
        quantity: Number(line.quantity),
        line_total: String(line.line_total),
      };
    }),
  };
}

/** Active board: new → ready only (reasonable limit). */
export async function listActiveCafeOrders(cafeId: string): Promise<CafeOrder[]> {
  await requireCafeAccess(cafeId);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_LIST_SELECT)
    .eq("cafe_id", cafeId)
    .in("status", ACTIVE_ORDER_STATUSES)
    .order("created_at", { ascending: true })
    .limit(150);

  if (error) {
    throw new Error("Unable to load orders.");
  }

  return (data ?? []).map((row) => mapCafeOrder(row as Record<string, unknown>));
}

/** @deprecated Prefer listActiveCafeOrders for the ops board. */
export async function listCafeOrders(cafeId: string): Promise<CafeOrder[]> {
  return listActiveCafeOrders(cafeId);
}

export type OrderHistoryFilters = {
  range?: "today" | "yesterday" | "7d" | "all";
  q?: string;
  page?: number;
  pageSize?: number;
};

export type OrderHistoryResult = {
  orders: CafeOrder[];
  page: number;
  pageSize: number;
  hasMore: boolean;
};

function historyRangeBounds(range: OrderHistoryFilters["range"]): {
  from?: string;
  to?: string;
} {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  if (range === "today") {
    return { from: startOfToday.toISOString() };
  }
  if (range === "yesterday") {
    const start = new Date(startOfToday);
    start.setDate(start.getDate() - 1);
    return { from: start.toISOString(), to: startOfToday.toISOString() };
  }
  if (range === "7d") {
    const start = new Date(startOfToday);
    start.setDate(start.getDate() - 7);
    return { from: start.toISOString() };
  }
  return {};
}

export async function listCafeOrderHistory(
  cafeId: string,
  filters: OrderHistoryFilters = {},
): Promise<OrderHistoryResult> {
  await requireCafeAccess(cafeId);
  const supabase = await createClient();

  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(50, Math.max(10, filters.pageSize ?? 20));
  const from = (page - 1) * pageSize;
  const to = from + pageSize;
  const bounds = historyRangeBounds(filters.range ?? "today");
  const q = filters.q?.trim() ?? "";

  let query = supabase
    .from("orders")
    .select(ORDER_LIST_SELECT)
    .eq("cafe_id", cafeId)
    .in("status", HISTORY_ORDER_STATUSES)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (bounds.from) query = query.gte("created_at", bounds.from);
  if (bounds.to) query = query.lt("created_at", bounds.to);

  const { data, error } = await query;

  if (error) {
    throw new Error("Unable to load order history.");
  }

  let orders = (data ?? []).map((row) => mapCafeOrder(row as Record<string, unknown>));

  if (q) {
    const needle = q.toLowerCase().replace(/^#/, "");
    orders = orders.filter((order) => {
      const numberMatch = String(order.order_number).includes(needle);
      const tableMatch = (order.table_code ?? "").toLowerCase().includes(needle);
      return numberMatch || tableMatch;
    });
  }

  const hasMore = orders.length > pageSize;
  return {
    orders: orders.slice(0, pageSize),
    page,
    pageSize,
    hasMore,
  };
}

export async function getCafeOrderDetail(
  cafeId: string,
  orderId: string,
): Promise<{ order: CafeOrder; items: CafeOrderItem[] } | null> {
  await requireCafeAccess(cafeId);
  const supabase = await createClient();

  const { data: orderRow, error: orderError } = await supabase
    .from("orders")
    .select(
      "id, cafe_id, table_id, order_number, status, subtotal, total, notes, rejection_reason, created_at, updated_at, confirmed_at, preparing_at, ready_at, completed_at, rejected_at, cafe_tables ( code )",
    )
    .eq("cafe_id", cafeId)
    .eq("id", orderId)
    .maybeSingle();

  if (orderError || !orderRow) return null;

  const { data: itemRows, error: itemError } = await supabase
    .from("order_items")
    .select(
      "id, order_id, menu_item_id, item_name_snapshot, item_price_snapshot, quantity, line_total, notes",
    )
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });

  if (itemError) {
    throw new Error("Unable to load order.");
  }

  const record = orderRow as Record<string, unknown>;
  const table = record.cafe_tables as { code?: string } | null;
  const items = (itemRows ?? []).map((row) => {
    const item = row as Record<string, unknown>;
    return {
      id: String(item.id),
      order_id: String(item.order_id),
      menu_item_id: (item.menu_item_id as string | null) ?? null,
      item_name_snapshot: String(item.item_name_snapshot),
      item_price_snapshot: String(item.item_price_snapshot),
      quantity: Number(item.quantity),
      line_total: String(item.line_total),
      notes: (item.notes as string | null) ?? null,
    };
  });

  return {
    order: {
      id: String(record.id),
      cafe_id: String(record.cafe_id),
      table_id: String(record.table_id),
      order_number: Number(record.order_number),
      status: record.status as OrderStatus,
      subtotal: String(record.subtotal),
      total: String(record.total),
      notes: (record.notes as string | null) ?? null,
      rejection_reason: (record.rejection_reason as string | null) ?? null,
      created_at: String(record.created_at),
      updated_at: String(record.updated_at),
      confirmed_at: (record.confirmed_at as string | null) ?? null,
      preparing_at: (record.preparing_at as string | null) ?? null,
      ready_at: (record.ready_at as string | null) ?? null,
      completed_at: (record.completed_at as string | null) ?? null,
      rejected_at: (record.rejected_at as string | null) ?? null,
      table_code: table?.code ?? null,
      item_count: items.length,
      lines: items.map((item) => ({
        name: item.item_name_snapshot,
        quantity: item.quantity,
      })),
    },
    items,
  };
}

export async function getOrderStatusHistory(
  cafeId: string,
  orderId: string,
): Promise<OrderStatusHistoryEntry[]> {
  await requireCafeAccess(cafeId);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("order_status_history")
    .select("id, order_id, old_status, new_status, changed_by, note, created_at")
    .eq("cafe_id", cafeId)
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error("Unable to load order history.");
  }

  return (data ?? []).map((row) => {
    const entry = row as Record<string, unknown>;
    return {
      id: String(entry.id),
      order_id: String(entry.order_id),
      old_status: (entry.old_status as OrderStatus | null) ?? null,
      new_status: entry.new_status as OrderStatus,
      changed_by: (entry.changed_by as string | null) ?? null,
      note: (entry.note as string | null) ?? null,
      created_at: String(entry.created_at),
    };
  });
}

export type OrderActionState = {
  error?: string;
  success?: string;
};

export async function transitionOrderAction(
  _prev: OrderActionState,
  formData: FormData,
): Promise<OrderActionState> {
  const parsed = transitionOrderSchema.safeParse({
    cafeId: formData.get("cafeId"),
    orderId: formData.get("orderId"),
    status: formData.get("status"),
    note: formData.get("note") || undefined,
  });

  if (!parsed.success) {
    return { error: "Invalid status update." };
  }

  await requireCafeAccess(parsed.data.cafeId);
  const supabase = await createClient();

  const { error } = await supabase.rpc("transition_order_status", {
    p_order_id: parsed.data.orderId,
    p_next: parsed.data.status,
    p_note: parsed.data.note ?? null,
  });

  if (error) {
    return { error: mapOrderError(error.message) };
  }

  revalidateOrderPaths(parsed.data.cafeId, parsed.data.orderId);
  return { success: "Order updated." };
}
