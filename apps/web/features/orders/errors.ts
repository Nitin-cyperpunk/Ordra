export function mapOrderError(error: unknown): string {
  const message =
    typeof error === "string"
      ? error
      : error && typeof error === "object" && "message" in error
        ? String((error as { message: unknown }).message)
        : "";

  if (message.includes("ORDER_CAFE_UNAVAILABLE")) {
    return "This cafe is currently unavailable.";
  }
  if (message.includes("ORDER_TABLE_UNAVAILABLE")) {
    return "This table is no longer available. Scan a table QR to order.";
  }
  if (
    message.includes("ORDER_ITEM_UNAVAILABLE") ||
    message.includes("ORDER_ITEM_INVALID")
  ) {
    return "Some items are no longer available. Update your cart and try again.";
  }
  if (message.includes("ORDER_EMPTY")) {
    return "Your cart is empty.";
  }
  if (message.includes("ORDER_NOTES_TOO_LONG")) {
    return "Order note is too long.";
  }
  if (message.includes("ORDER_INVALID_TRANSITION")) {
    return "That status change isn’t allowed.";
  }
  if (message.includes("ORDER_BAD_NOTE")) {
    return "Please keep the reason under 250 characters.";
  }
  if (message.includes("ORDER_FORBIDDEN") || message.includes("ORDER_NOT_FOUND")) {
    return "You don’t have access to this order.";
  }
  if (message.includes("ORDER_IDEMPOTENCY_CONFLICT")) {
    return "Couldn't place your order. Please try again.";
  }

  if (message.includes("ORDER_")) {
    return "Couldn't update this order. Please try again.";
  }

  return "Couldn't place your order. Please try again.";
}
