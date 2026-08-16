import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { mapOrderError } from "../errors";
import { placeOrderSchema, transitionOrderSchema } from "../schemas";
import { ORDER_TRANSITIONS, nextOrderActions } from "../types";

describe("placeOrderSchema", () => {
  it("accepts menu item ids and quantities only (no client prices)", () => {
    const parsed = placeOrderSchema.parse({
      cafeSlug: "blue-bean",
      tableToken: "tokensecret12",
      idempotencyKey: "idem-12345678",
      items: [{ menuItemId: "11111111-1111-1111-1111-111111111111", quantity: 2 }],
    });
    assert.equal(parsed.items[0]?.quantity, 2);
    assert.equal(Object.prototype.hasOwnProperty.call(parsed.items[0], "price"), false);
  });

  it("rejects empty carts", () => {
    const result = placeOrderSchema.safeParse({
      cafeSlug: "blue-bean",
      tableToken: "tokensecret12",
      idempotencyKey: "idem-12345678",
      items: [],
    });
    assert.equal(result.success, false);
  });
});

describe("order status machine", () => {
  it("allows pending → confirmed/rejected only", () => {
    assert.deepEqual(ORDER_TRANSITIONS.pending, ["confirmed", "rejected"]);
    assert.deepEqual(ORDER_TRANSITIONS.confirmed, ["preparing"]);
    assert.deepEqual(ORDER_TRANSITIONS.preparing, ["ready"]);
    assert.deepEqual(ORDER_TRANSITIONS.ready, ["completed"]);
    assert.deepEqual(ORDER_TRANSITIONS.completed, []);
  });

  it("does not offer pending → completed in staff UI actions", () => {
    const actions = nextOrderActions("pending");
    assert.equal(
      actions.some((action) => action.status === "completed"),
      false,
    );
  });
});

describe("transitionOrderSchema", () => {
  it("rejects unknown statuses", () => {
    const result = transitionOrderSchema.safeParse({
      cafeId: "11111111-1111-1111-1111-111111111111",
      orderId: "22222222-2222-2222-2222-222222222222",
      status: "shipped",
    });
    assert.equal(result.success, false);
  });
});

describe("mapOrderError", () => {
  it("maps cafe/table unavailable safely", () => {
    assert.match(mapOrderError("ORDER_CAFE_UNAVAILABLE"), /unavailable/i);
    assert.match(mapOrderError("ORDER_TABLE_UNAVAILABLE"), /table/i);
  });

  it("hides raw database text", () => {
    assert.equal(
      mapOrderError("permission denied for table orders"),
      "Couldn't place your order. Please try again.",
    );
  });
});
