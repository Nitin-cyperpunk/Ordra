"use server";

import { revalidatePath } from "next/cache";

import { mapOrderError } from "@/features/orders/errors";
import { ensureGuestSessionId, getGuestSessionId } from "@/features/orders/guest-session";
import { placeOrderSchema, transitionOrderSchema } from "@/features/orders/schemas";
import type {
  CafeOrder,
  CafeOrderItem,
  GuestOrderView,
  OrderStatus,
} from "@/features/orders/types";
import { requireCafeAccess } from "@/features/memberships/access";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type PlaceOrderResult =
  | { ok: true; publicToken: string; orderNumber: number; replayed: boolean }
  | { ok: false; error: string };

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

export async function listCafeOrders(cafeId: string): Promise<CafeOrder[]> {
  await requireCafeAccess(cafeId);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, cafe_id, table_id, order_number, status, subtotal, total, notes, created_at, updated_at, cafe_tables ( code ), order_items ( id )",
    )
    .eq("cafe_id", cafeId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    throw new Error("Unable to load orders.");
  }

  return (data ?? []).map((row) => {
    const record = row as Record<string, unknown>;
    const table = record.cafe_tables as { code?: string } | null;
    const items = record.order_items as unknown[] | null;
    return {
      id: String(record.id),
      cafe_id: String(record.cafe_id),
      table_id: String(record.table_id),
      order_number: Number(record.order_number),
      status: record.status as OrderStatus,
      subtotal: String(record.subtotal),
      total: String(record.total),
      notes: (record.notes as string | null) ?? null,
      created_at: String(record.created_at),
      updated_at: String(record.updated_at),
      table_code: table?.code ?? null,
      item_count: items?.length ?? 0,
    };
  });
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
      "id, cafe_id, table_id, order_number, status, subtotal, total, notes, created_at, updated_at, cafe_tables ( code )",
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
      created_at: String(record.created_at),
      updated_at: String(record.updated_at),
      table_code: table?.code ?? null,
      item_count: itemRows?.length ?? 0,
    },
    items: (itemRows ?? []).map((row) => {
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
    }),
  };
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
  });

  if (!parsed.success) {
    return { error: "Invalid status update." };
  }

  await requireCafeAccess(parsed.data.cafeId);
  const supabase = await createClient();

  const { error } = await supabase.rpc("transition_order_status", {
    p_order_id: parsed.data.orderId,
    p_next: parsed.data.status,
  });

  if (error) {
    return { error: mapOrderError(error.message) };
  }

  revalidatePath(`/dashboard/cafes/${parsed.data.cafeId}/orders`);
  revalidatePath(`/dashboard/cafes/${parsed.data.cafeId}/orders/${parsed.data.orderId}`);

  return { success: "Order updated." };
}
