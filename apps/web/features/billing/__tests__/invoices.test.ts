import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { mapInvoiceError } from "../errors";
import {
  INVOICE_GENERATION_MIN_MS,
  INVOICE_NUMBER_PATTERN,
  canCreateInvoice,
  invoiceMatchesQuery,
  invoiceStatusLabel,
  invoiceTotalAmount,
  isPositiveMoney,
  isValidInvoiceNumber,
  normalizeMoney,
} from "../invoice-logic";
import { guestIssueInvoiceSchema, issueInvoiceSchema } from "../schemas";
import { formatInvoiceOrderNumber, invoicePdfFilename } from "../types";

describe("invoice numbering", () => {
  it("accepts INV-YYYY-000001 format", () => {
    assert.equal(isValidInvoiceNumber("INV-2026-000001"), true);
    assert.equal(isValidInvoiceNumber("INV-2026-000002"), true);
    assert.match("INV-2026-000003", INVOICE_NUMBER_PATTERN);
  });

  it("rejects client-shaped or duplicate-looking invalid numbers", () => {
    assert.equal(isValidInvoiceNumber("INV-26-1"), false);
    assert.equal(isValidInvoiceNumber("inv-2026-000001"), false);
    assert.equal(isValidInvoiceNumber("INV-2026-00001"), false);
    assert.equal(isValidInvoiceNumber(""), false);
  });
});

describe("invoice business rules", () => {
  it("allows invoices only for completed orders", () => {
    assert.equal(canCreateInvoice("completed"), true);
    assert.equal(canCreateInvoice("ready"), false);
    assert.equal(canCreateInvoice("pending"), false);
    assert.equal(canCreateInvoice("rejected"), false);
  });

  it("snapshots totals as subtotal + tax - discount without inventing tax", () => {
    assert.equal(invoiceTotalAmount("540.00", "0", "0"), "540.00");
    assert.equal(invoiceTotalAmount("540.00"), "540.00");
    assert.equal(invoiceTotalAmount("540.00", "27.00", "10.00"), "557.00");
    assert.equal(isPositiveMoney("0.00"), false);
    assert.equal(isPositiveMoney("0.01"), true);
  });

  it("normalizes money for stable invoice display", () => {
    assert.equal(normalizeMoney(540), "540.00");
    assert.equal(normalizeMoney("240.5"), "240.50");
  });

  it("keeps one-order-one-invoice search identifiers distinct", () => {
    assert.equal(formatInvoiceOrderNumber(1024), "ORD-1024");
    assert.equal(invoiceStatusLabel("issued"), "Generated");
  });
});

describe("invoice search", () => {
  const invoice = {
    invoice_number: "INV-2026-000001",
    order_number: 1024,
    table_code: "T2",
    customer_name: "Rahul",
  };

  it("matches invoice number, order number, and customer", () => {
    assert.equal(invoiceMatchesQuery(invoice, "INV-2026-000001"), true);
    assert.equal(invoiceMatchesQuery(invoice, "ord-1024"), true);
    assert.equal(invoiceMatchesQuery(invoice, "Rahul"), true);
    assert.equal(invoiceMatchesQuery(invoice, "T2"), true);
  });

  it("does not match unrelated cafes or customers", () => {
    assert.equal(invoiceMatchesQuery(invoice, "INV-2026-000002"), false);
    assert.equal(invoiceMatchesQuery(invoice, "Priya"), false);
  });
});

describe("issueInvoiceSchema", () => {
  it("requires cafe and order ids from the server caller", () => {
    const parsed = issueInvoiceSchema.parse({
      cafeId: "11111111-1111-1111-1111-111111111111",
      orderId: "22222222-2222-2222-2222-222222222222",
    });
    assert.equal(parsed.orderId.startsWith("2222"), true);
  });

  it("rejects a client-provided invoice number", () => {
    const parsed = issueInvoiceSchema.parse({
      cafeId: "11111111-1111-1111-1111-111111111111",
      orderId: "22222222-2222-2222-2222-222222222222",
      invoiceNumber: "INV-2026-000099",
    });
    assert.equal("invoiceNumber" in parsed, false);
  });
});

describe("guestIssueInvoiceSchema", () => {
  it("requires an order public token, not an arbitrary order id", () => {
    assert.equal(
      guestIssueInvoiceSchema.safeParse({ publicToken: "short" }).success,
      false,
    );
    assert.equal(
      guestIssueInvoiceSchema.safeParse({
        publicToken: "guest-token-abc",
        orderId: "22222222-2222-2222-2222-222222222222",
      }).success,
      true,
    );
  });
});

describe("mapInvoiceError", () => {
  it("maps not-ready and existing invoices without raw database text", () => {
    assert.equal(
      mapInvoiceError("INVOICE_ORDER_NOT_READY"),
      "This order is not ready for invoicing.",
    );
    assert.equal(mapInvoiceError("INVOICE_EXISTS"), "This invoice already exists.");
    assert.equal(
      mapInvoiceError("permission denied for table invoices"),
      "Unable to create the invoice. Please try again.",
    );
  });

  it("maps unauthorized access safely", () => {
    assert.equal(
      mapInvoiceError("INVOICE_FORBIDDEN"),
      "You don’t have access to this invoice.",
    );
    assert.equal(
      mapInvoiceError("INVOICE_ORDER_NOT_FOUND"),
      "You don’t have access to this invoice.",
    );
  });
});

describe("invoice pdf helpers", () => {
  it("builds a safe download filename from the invoice number", () => {
    assert.equal(invoicePdfFilename("INV-2026-000001"), "inv-2026-000001.pdf");
  });

  it("keeps generation animation short", () => {
    assert.equal(INVOICE_GENERATION_MIN_MS <= 2000, true);
    assert.equal(INVOICE_GENERATION_MIN_MS >= 1000, true);
  });
});
