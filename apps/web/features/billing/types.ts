export const INVOICE_STATUSES = ["issued"] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export type InvoiceItem = {
  id: string;
  invoice_id?: string;
  name: string;
  unit_price: string;
  quantity: number;
  line_total: string;
};

export type Invoice = {
  id: string;
  cafe_id: string;
  order_id: string;
  invoice_number: string;
  status: InvoiceStatus;
  customer_name: string | null;
  customer_phone: string | null;
  table_code: string | null;
  order_number: number;
  cafe_name: string;
  cafe_phone: string | null;
  cafe_email: string | null;
  cafe_address: string | null;
  cafe_logo_url: string | null;
  currency: string;
  subtotal: string;
  tax_amount: string;
  discount_amount: string;
  total_amount: string;
  notes: string | null;
  issued_at: string;
  items: InvoiceItem[];
};

export type InvoiceListRow = {
  id: string;
  invoice_number: string;
  order_id: string;
  order_number: number;
  table_code: string | null;
  customer_name: string | null;
  total_amount: string;
  status: InvoiceStatus;
  issued_at: string;
};

export const INVOICE_SELECT =
  "id, cafe_id, order_id, invoice_number, status, customer_name, customer_phone, table_code, order_number, cafe_name_snapshot, cafe_phone_snapshot, cafe_email_snapshot, cafe_address_snapshot, cafe_logo_url_snapshot, currency, subtotal, tax_amount, discount_amount, total_amount, notes_snapshot, issued_at" as const;

export function formatInvoiceNumber(invoiceNumber: string): string {
  return invoiceNumber;
}

export function formatInvoiceOrderNumber(orderNumber: number): string {
  return `ORD-${orderNumber}`;
}

export function invoicePdfFilename(invoiceNumber: string): string {
  return `${invoiceNumber.toLowerCase().replace(/[^a-z0-9-]+/g, "-")}.pdf`;
}
