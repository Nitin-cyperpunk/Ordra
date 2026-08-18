import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

import {
  formatInvoiceIssuedAt,
  isPositiveMoney,
  normalizeMoney,
} from "@/features/billing/invoice-logic";
import type { Invoice } from "@/features/billing/types";
import { formatInvoiceOrderNumber, invoicePdfFilename } from "@/features/billing/types";

function pdfSafe(value: string): string {
  return Array.from(value)
    .map((char) => (char.charCodeAt(0) <= 255 ? char : " "))
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

function pdfMoney(amount: unknown, currency: string): string {
  const value = normalizeMoney(amount);
  if (currency === "INR") return `Rs. ${value}`;
  return `${currency} ${value}`;
}

export async function buildInvoicePdfBytes(invoice: Invoice): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const pageSize: [number, number] = [595.28, 841.89];
  let page = doc.addPage(pageSize);
  const margin = 50;
  const right = pageSize[0] - margin;
  let y = pageSize[1] - 56;
  const ink = rgb(0.08, 0.08, 0.08);
  const muted = rgb(0.38, 0.38, 0.38);
  const issued = formatInvoiceIssuedAt(invoice.issued_at);

  const ensureSpace = (needed: number) => {
    if (y - needed < 56) {
      page = doc.addPage(pageSize);
      y = pageSize[1] - 56;
    }
  };

  page.drawText("ORDRA INVOICE", {
    x: margin,
    y,
    size: 9,
    font: bold,
    color: muted,
  });
  y -= 22;

  page.drawText(pdfSafe(invoice.cafe_name) || "Cafe", {
    x: margin,
    y,
    size: 18,
    font: bold,
    color: ink,
  });
  y -= 16;

  const letterhead = [
    invoice.cafe_address,
    invoice.cafe_phone,
    invoice.cafe_email,
  ].filter((line): line is string => Boolean(line));
  for (const line of letterhead) {
    page.drawText(pdfSafe(line), { x: margin, y, size: 10, font: regular, color: muted });
    y -= 14;
  }

  y -= 8;
  page.drawLine({
    start: { x: margin, y },
    end: { x: right, y },
    thickness: 0.6,
    color: rgb(0.86, 0.86, 0.86),
  });
  y -= 20;

  page.drawText(invoice.invoice_number, {
    x: margin,
    y,
    size: 11,
    font: bold,
    color: ink,
  });
  const orderLabel = formatInvoiceOrderNumber(invoice.order_number);
  page.drawText(orderLabel, {
    x: right - bold.widthOfTextAtSize(orderLabel, 11),
    y,
    size: 11,
    font: bold,
    color: ink,
  });
  y -= 16;

  const when = `${issued.date}  ${issued.time}`.trim();
  page.drawText(when, { x: margin, y, size: 10, font: regular, color: muted });
  if (invoice.table_code) {
    const table = `Table ${invoice.table_code}`;
    page.drawText(table, {
      x: right - regular.widthOfTextAtSize(table, 10),
      y,
      size: 10,
      font: regular,
      color: muted,
    });
  }
  y -= 16;

  if (invoice.customer_name || invoice.customer_phone) {
    page.drawText(
      pdfSafe(
        [invoice.customer_name, invoice.customer_phone].filter(Boolean).join("  ·  "),
      ),
      {
        x: margin,
        y,
        size: 10,
        font: regular,
        color: muted,
      },
    );
    y -= 18;
  }

  page.drawText("Item", { x: margin, y, size: 9, font: bold, color: muted });
  page.drawText("Qty", { x: 340, y, size: 9, font: bold, color: muted });
  page.drawText("Price", { x: 390, y, size: 9, font: bold, color: muted });
  page.drawText("Total", {
    x: right - bold.widthOfTextAtSize("Total", 9),
    y,
    size: 9,
    font: bold,
    color: muted,
  });
  y -= 8;
  page.drawLine({
    start: { x: margin, y },
    end: { x: right, y },
    thickness: 0.6,
    color: rgb(0.86, 0.86, 0.86),
  });
  y -= 18;

  for (const item of invoice.items) {
    ensureSpace(20);
    page.drawText(pdfSafe(item.name).slice(0, 42), {
      x: margin,
      y,
      size: 10,
      font: regular,
      color: ink,
    });
    page.drawText(String(item.quantity), {
      x: 340,
      y,
      size: 10,
      font: regular,
      color: ink,
    });
    page.drawText(pdfMoney(item.unit_price, invoice.currency), {
      x: 390,
      y,
      size: 10,
      font: regular,
      color: ink,
    });
    const lineTotal = pdfMoney(item.line_total, invoice.currency);
    page.drawText(lineTotal, {
      x: right - regular.widthOfTextAtSize(lineTotal, 10),
      y,
      size: 10,
      font: regular,
      color: ink,
    });
    y -= 18;
  }

  y -= 4;
  page.drawLine({
    start: { x: margin, y },
    end: { x: right, y },
    thickness: 0.6,
    color: rgb(0.86, 0.86, 0.86),
  });
  y -= 20;

  const totals: Array<{ label: string; value: unknown; emphasize?: boolean }> = [
    { label: "Subtotal", value: invoice.subtotal },
  ];
  if (isPositiveMoney(invoice.tax_amount)) {
    totals.push({ label: "Tax", value: invoice.tax_amount });
  }
  if (isPositiveMoney(invoice.discount_amount)) {
    totals.push({ label: "Discount", value: invoice.discount_amount });
  }
  totals.push({ label: "Total", value: invoice.total_amount, emphasize: true });

  for (const row of totals) {
    ensureSpace(18);
    const font = row.emphasize ? bold : regular;
    const size = row.emphasize ? 12 : 10;
    const color = row.emphasize ? ink : muted;
    page.drawText(row.label, { x: 360, y, size, font, color });
    const value = pdfMoney(row.value, invoice.currency);
    page.drawText(value, {
      x: right - font.widthOfTextAtSize(value, size),
      y,
      size,
      font,
      color,
    });
    y -= 16;
  }

  if (invoice.notes) {
    y -= 10;
    ensureSpace(24);
    page.drawText(pdfSafe(`Note: ${invoice.notes}`).slice(0, 110), {
      x: margin,
      y,
      size: 9,
      font: regular,
      color: muted,
    });
  }

  page.drawText("Thank you  ·  Powered by Ordra", {
    x: margin,
    y: 36,
    size: 8,
    font: regular,
    color: muted,
  });

  return doc.save();
}

export async function downloadInvoicePdf(invoice: Invoice): Promise<void> {
  const bytes = await buildInvoicePdfBytes(invoice);
  const blob = new Blob([Uint8Array.from(bytes)], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = invoicePdfFilename(invoice.invoice_number);
  anchor.click();
  URL.revokeObjectURL(url);
}
