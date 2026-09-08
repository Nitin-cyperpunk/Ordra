export function mapInvoiceError(error: unknown): string {
  const message =
    typeof error === "string"
      ? error
      : error && typeof error === "object" && "message" in error
        ? String((error as { message: unknown }).message)
        : "";

  if (message.includes("INVOICE_ORDER_NOT_READY")) {
    return "This order is not ready for invoicing.";
  }
  if (
    message.includes("INVOICE_ORDER_NOT_FOUND") ||
    message.includes("INVOICE_FORBIDDEN")
  ) {
    return "You don’t have access to this invoice.";
  }
  if (message.includes("INVOICE_EXISTS") || message.includes("invoices_order_unique")) {
    return "This invoice already exists.";
  }
  if (message.includes("INVOICE_")) {
    return "Unable to create the invoice. Please try again.";
  }

  return "Unable to create the invoice. Please try again.";
}
