import { formatMenuPrice } from "@/features/menu/types";

export const INVOICE_NUMBER_PATTERN = /^INV-[0-9]{4}-[0-9]{6}$/;

export const INVOICE_GENERATION_STEPS = [
  "Generating invoice…",
  "Preparing items…",
  "Calculating total…",
  "Finalizing invoice…",
  "Invoice ready",
] as const;

export const INVOICE_GENERATION_MIN_MS = 1400;
export const INVOICE_GENERATION_REDUCED_MS = 180;

export type InvoiceSearchFields = {
  invoice_number: string;
  order_number: number;
  table_code: string | null;
  customer_name?: string | null;
};

export function isValidInvoiceNumber(value: string): boolean {
  return INVOICE_NUMBER_PATTERN.test(value);
}

export function canCreateInvoice(orderStatus: string): boolean {
  return orderStatus === "completed";
}

export function invoiceStatusLabel(status: string): string {
  return status === "issued" ? "Generated" : status;
}

export function normalizeMoney(value: unknown): string {
  const raw = String(value ?? "0").trim();
  const amount = Number.parseFloat(raw);
  if (!Number.isFinite(amount)) return "0.00";
  return amount.toFixed(2);
}

export function formatInvoiceMoney(amount: unknown, currency = "INR"): string {
  return formatMenuPrice(normalizeMoney(amount), currency);
}

export function isPositiveMoney(value: unknown): boolean {
  return Number.parseFloat(normalizeMoney(value)) > 0;
}

function moneyToCents(value: unknown): number {
  const normalized = normalizeMoney(value);
  const [rawWhole, rawFraction] = normalized.split(".");
  const whole = rawWhole ?? "0";
  const fraction = (rawFraction ?? "00").slice(0, 2).padEnd(2, "0");
  const sign = whole.startsWith("-") ? -1 : 1;
  const absWhole = whole.replace("-", "") || "0";
  return sign * (Number.parseInt(absWhole, 10) * 100 + Number.parseInt(fraction, 10));
}

export function invoiceTotalAmount(
  subtotal: unknown,
  taxAmount: unknown = 0,
  discountAmount: unknown = 0,
): string {
  const cents =
    moneyToCents(subtotal) + moneyToCents(taxAmount) - moneyToCents(discountAmount);
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}

export function invoiceMatchesQuery(
  invoice: InvoiceSearchFields,
  query: string,
): boolean {
  const needle = query.trim().toLowerCase().replace(/^#/, "");
  if (!needle) return true;

  const orderNeedle = needle.replace(/^ord-/, "");
  const invoiceNeedle = needle.replace(/^inv-/, "");

  return (
    invoice.invoice_number.toLowerCase().includes(needle) ||
    invoice.invoice_number.toLowerCase().includes(invoiceNeedle) ||
    String(invoice.order_number).includes(orderNeedle) ||
    `ord-${invoice.order_number}`.includes(needle) ||
    (invoice.table_code ?? "").toLowerCase().includes(needle) ||
    (invoice.customer_name ?? "").toLowerCase().includes(needle)
  );
}

export function formatInvoiceIssuedAt(iso: string): { date: string; time: string } {
  const issued = new Date(iso);
  if (Number.isNaN(issued.getTime())) {
    return { date: "—", time: "" };
  }

  return {
    date: issued.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    time: issued.toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
    }),
  };
}

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
