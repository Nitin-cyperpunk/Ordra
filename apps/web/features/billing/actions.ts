"use server";

import { revalidatePath } from "next/cache";

import { mapInvoiceError } from "@/features/billing/errors";
import { invoiceMatchesQuery, normalizeMoney } from "@/features/billing/invoice-logic";
import { guestIssueInvoiceSchema, issueInvoiceSchema } from "@/features/billing/schemas";
import type {
  Invoice,
  InvoiceItem,
  InvoiceListRow,
  InvoiceStatus,
} from "@/features/billing/types";
import { INVOICE_SELECT } from "@/features/billing/types";
import { getGuestSessionId } from "@/features/orders/guest-session";
import { requireCafeAccess } from "@/features/memberships/access";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type IssueInvoiceResult =
  | { ok: true; invoiceId: string; invoiceNumber: string; alreadyExisted: boolean }
  | { ok: false; error: string };

function mapInvoiceRow(row: Record<string, unknown>, items: InvoiceItem[] = []): Invoice {
  return {
    id: String(row.id),
    cafe_id: String(row.cafe_id),
    order_id: String(row.order_id),
    invoice_number: String(row.invoice_number),
    status: row.status as InvoiceStatus,
    customer_name: (row.customer_name as string | null) ?? null,
    customer_phone: (row.customer_phone as string | null) ?? null,
    table_code: (row.table_code as string | null) ?? null,
    order_number: Number(row.order_number),
    cafe_name: String(row.cafe_name_snapshot ?? row.cafe_name ?? ""),
    cafe_phone:
      (row.cafe_phone_snapshot as string | null) ??
      (row.cafe_phone as string | null) ??
      null,
    cafe_email:
      (row.cafe_email_snapshot as string | null) ??
      (row.cafe_email as string | null) ??
      null,
    cafe_address:
      (row.cafe_address_snapshot as string | null) ??
      (row.cafe_address as string | null) ??
      null,
    cafe_logo_url:
      (row.cafe_logo_url_snapshot as string | null) ??
      (row.cafe_logo_url as string | null) ??
      null,
    currency: String(row.currency ?? "INR"),
    subtotal: normalizeMoney(row.subtotal),
    tax_amount: normalizeMoney(row.tax_amount ?? "0"),
    discount_amount: normalizeMoney(row.discount_amount ?? "0"),
    total_amount: normalizeMoney(row.total_amount),
    notes: (row.notes_snapshot as string | null) ?? (row.notes as string | null) ?? null,
    issued_at: String(row.issued_at),
    items,
  };
}

async function loadInvoiceItems(
  supabase: Awaited<ReturnType<typeof createClient>>,
  invoiceId: string,
): Promise<InvoiceItem[]> {
  const { data, error } = await supabase
    .from("invoice_items")
    .select(
      "id, invoice_id, item_name_snapshot, unit_price_snapshot, quantity, line_total",
    )
    .eq("invoice_id", invoiceId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error("Unable to load invoice.");
  }

  return (data ?? []).map((row) => {
    const item = row as Record<string, unknown>;
    return {
      id: String(item.id),
      invoice_id: String(item.invoice_id),
      name: String(item.item_name_snapshot),
      unit_price: normalizeMoney(item.unit_price_snapshot),
      quantity: Number(item.quantity),
      line_total: normalizeMoney(item.line_total),
    };
  });
}

export async function getInvoiceForOrder(
  cafeId: string,
  orderId: string,
): Promise<InvoiceListRow | null> {
  await requireCafeAccess(cafeId);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invoices")
    .select(
      "id, invoice_number, order_id, order_number, table_code, customer_name, total_amount, status, issued_at",
    )
    .eq("cafe_id", cafeId)
    .eq("order_id", orderId)
    .maybeSingle();

  if (error || !data) return null;
  return mapInvoiceListRow(data as Record<string, unknown>);
}

function mapInvoiceListRow(row: Record<string, unknown>): InvoiceListRow {
  return {
    id: String(row.id),
    invoice_number: String(row.invoice_number),
    order_id: String(row.order_id),
    order_number: Number(row.order_number),
    table_code: (row.table_code as string | null) ?? null,
    customer_name: (row.customer_name as string | null) ?? null,
    total_amount: normalizeMoney(row.total_amount),
    status: row.status as InvoiceStatus,
    issued_at: String(row.issued_at),
  };
}

export async function getCafeInvoice(
  cafeId: string,
  invoiceId: string,
): Promise<Invoice | null> {
  await requireCafeAccess(cafeId);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invoices")
    .select(INVOICE_SELECT)
    .eq("cafe_id", cafeId)
    .eq("id", invoiceId)
    .maybeSingle();

  if (error || !data) return null;
  const items = await loadInvoiceItems(supabase, invoiceId);
  return mapInvoiceRow(data as Record<string, unknown>, items);
}

export type InvoiceHistoryFilters = {
  range?: "today" | "yesterday" | "7d" | "all";
  q?: string;
  page?: number;
  pageSize?: number;
};

export type InvoiceHistoryResult = {
  invoices: InvoiceListRow[];
  page: number;
  pageSize: number;
  hasMore: boolean;
};

function historyRangeBounds(range: InvoiceHistoryFilters["range"]): {
  from?: string;
  to?: string;
} {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  if (range === "today") return { from: startOfToday.toISOString() };
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

export async function listCafeInvoices(
  cafeId: string,
  filters: InvoiceHistoryFilters = {},
): Promise<InvoiceHistoryResult> {
  await requireCafeAccess(cafeId);
  const supabase = await createClient();
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(50, Math.max(10, filters.pageSize ?? 20));
  const from = (page - 1) * pageSize;
  const to = from + pageSize;
  const bounds = historyRangeBounds(filters.range ?? "today");
  const q = filters.q?.trim() ?? "";

  let query = supabase
    .from("invoices")
    .select(
      "id, invoice_number, order_id, order_number, table_code, customer_name, total_amount, status, issued_at",
    )
    .eq("cafe_id", cafeId)
    .order("issued_at", { ascending: false })
    .range(from, to);

  if (bounds.from) query = query.gte("issued_at", bounds.from);
  if (bounds.to) query = query.lt("issued_at", bounds.to);

  const { data, error } = await query;
  if (error) {
    throw new Error("Unable to load invoices.");
  }

  let invoices = (data ?? []).map((row) =>
    mapInvoiceListRow(row as Record<string, unknown>),
  );

  if (q) {
    invoices = invoices.filter((invoice) => invoiceMatchesQuery(invoice, q));
  }

  const hasMore = invoices.length > pageSize;
  return { invoices: invoices.slice(0, pageSize), page, pageSize, hasMore };
}

export async function issueInvoiceForOrderAction(
  input: unknown,
): Promise<IssueInvoiceResult> {
  const parsed = issueInvoiceSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Unable to create the invoice. Please try again." };
  }

  await requireCafeAccess(parsed.data.cafeId);
  const supabase = await createClient();

  const existing = await getInvoiceForOrder(parsed.data.cafeId, parsed.data.orderId);
  if (existing) {
    return {
      ok: true,
      invoiceId: existing.id,
      invoiceNumber: existing.invoice_number,
      alreadyExisted: true,
    };
  }

  const { data, error } = await supabase.rpc("issue_invoice_for_order", {
    p_order_id: parsed.data.orderId,
  });

  if (error || !data) {
    const raced = await getInvoiceForOrder(parsed.data.cafeId, parsed.data.orderId);
    if (raced) {
      return {
        ok: true,
        invoiceId: raced.id,
        invoiceNumber: raced.invoice_number,
        alreadyExisted: true,
      };
    }
    return { ok: false, error: mapInvoiceError(error?.message) };
  }

  const row = data as Record<string, unknown>;
  revalidatePath(`/dashboard/cafes/${parsed.data.cafeId}/orders/${parsed.data.orderId}`);
  revalidatePath(`/dashboard/cafes/${parsed.data.cafeId}/billing`);

  return {
    ok: true,
    invoiceId: String(row.id),
    invoiceNumber: String(row.invoice_number),
    alreadyExisted: false,
  };
}

export async function getGuestInvoice(publicToken: string): Promise<Invoice | null> {
  const sessionId = await getGuestSessionId();
  if (!sessionId) return null;

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("get_customer_invoice", {
    p_public_token: publicToken,
    p_customer_session_id: sessionId,
  });

  if (error || !data) return null;
  const row = data as Record<string, unknown>;
  const rawItems = Array.isArray(row.items) ? row.items : [];

  return mapInvoiceRow(
    {
      ...row,
      cafe_id: "",
      order_id: "",
      cafe_name_snapshot: row.cafe_name,
      cafe_phone_snapshot: row.cafe_phone,
      cafe_email_snapshot: row.cafe_email,
      cafe_address_snapshot: row.cafe_address,
      cafe_logo_url_snapshot: row.cafe_logo_url,
      notes_snapshot: row.notes,
    },
    rawItems.map((item) => {
      const line = item as Record<string, unknown>;
      return {
        id: String(line.id),
        name: String(line.name),
        unit_price: normalizeMoney(line.unit_price),
        quantity: Number(line.quantity),
        line_total: normalizeMoney(line.line_total),
      };
    }),
  );
}

export async function issueGuestInvoiceAction(
  input: unknown,
): Promise<IssueInvoiceResult> {
  const parsed = guestIssueInvoiceSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Unable to create the invoice. Please try again." };
  }

  const sessionId = await getGuestSessionId();
  if (!sessionId) {
    return { ok: false, error: "You don’t have access to this invoice." };
  }

  const admin = createAdminClient();
  try {
    const { data, error } = await admin.rpc("issue_guest_invoice", {
      p_public_token: parsed.data.publicToken,
      p_customer_session_id: sessionId,
    });

    if (error || !data) {
      return { ok: false, error: mapInvoiceError(error?.message) };
    }

    const row = data as Record<string, unknown>;
    return {
      ok: true,
      invoiceId: String(row.id),
      invoiceNumber: String(row.invoice_number),
      alreadyExisted: Boolean(row.already_existed),
    };
  } catch {
    return { ok: false, error: "Unable to create the invoice. Please try again." };
  }
}
