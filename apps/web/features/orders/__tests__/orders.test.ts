import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { mapOrderError } from "../errors";
import { placeOrderSchema, transitionOrderSchema } from "../schemas";
import { ORDER_TRANSITIONS, nextOrderActions, orderAgeUrgency } from "../types";

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

describe("order ops helpers", () => {
  it("labels Accept / Cancel for pending actions", () => {
    const actions = nextOrderActions("pending");
    assert.equal(actions[0]?.label, "Accept order");
    assert.equal(
      actions.some((action) => action.needsReason),
      true,
    );
  });

  it("classifies waiting urgency without inventing precision", () => {
    const now = Date.UTC(2026, 7, 16, 12, 0, 0);
    const fresh = new Date(now - 2 * 60_000).toISOString();
    const aging = new Date(now - 9 * 60_000).toISOString();
    const stale = new Date(now - 20 * 60_000).toISOString();
    assert.equal(orderAgeUrgency(fresh, now), "fresh");
    assert.equal(orderAgeUrgency(aging, now), "aging");
    assert.equal(orderAgeUrgency(stale, now), "stale");
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

  it("maps unavailable cart items for guests", () => {
    assert.match(mapOrderError("ORDER_ITEM_UNAVAILABLE"), /no longer available/i);
    assert.match(mapOrderError("ORDER_BAD_QUANTITY"), /quantity/i);
  });

  it("hides raw database text", () => {
    assert.equal(
      mapOrderError("permission denied for table orders"),
      "Unable to place your order. Please try again.",
    );
  });
});
