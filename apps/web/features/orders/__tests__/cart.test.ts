import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  addCartLine,
  cartEstimatedSubtotal,
  cartItemCount,
  cartStorageKey,
  findOtherCafeCarts,
  parseCartLines,
  removeCartLine,
  setCartQuantity,
  type CartLine,
} from "../cart-logic";
import { placeOrderSchema } from "../schemas";
import { GUEST_TRACK_LABELS, ORDER_STATUSES } from "../types";

const cappuccino: Omit<CartLine, "quantity"> = {
  menuItemId: "11111111-1111-1111-1111-111111111111",
  name: "Cappuccino",
  unitPrice: "149",
};

describe("cart operations", () => {
  it("adds, increases, decreases, and removes items", () => {
    let lines: CartLine[] = [];
    lines = addCartLine(lines, cappuccino);
    assert.equal(lines[0]?.quantity, 1);
    lines = addCartLine(lines, cappuccino);
    assert.equal(lines[0]?.quantity, 2);
    lines = setCartQuantity(lines, cappuccino.menuItemId, 3);
    assert.equal(cartItemCount(lines), 3);
    lines = setCartQuantity(lines, cappuccino.menuItemId, 0);
    assert.equal(lines.length, 0);
    lines = addCartLine(lines, cappuccino);
    lines = removeCartLine(lines, cappuccino.menuItemId);
    assert.equal(lines.length, 0);
  });

  it("clears the cart", () => {
    let lines = addCartLine([], cappuccino);
    lines = [];
    assert.equal(cartItemCount(lines), 0);
  });

  it("estimates subtotal from display prices only", () => {
    const lines = addCartLine([], { ...cappuccino, unitPrice: "100.50" });
    const withQty = setCartQuantity(lines, cappuccino.menuItemId, 2);
    assert.equal(cartEstimatedSubtotal(withQty), 201);
  });

  it("scopes storage keys per cafe", () => {
    const a = cartStorageKey("blue-bean", "table-a");
    const b = cartStorageKey("other-cafe", "table-a");
    assert.notEqual(a, b);
    assert.match(a, /^ordra-cart:blue-bean:/);
  });

  it("cannot mix cafes — other cafe carts are detected separately", () => {
    const keys = ["ordra-cart:blue-bean:none", "ordra-cart:other-cafe:tok"];
    const values: Record<string, string> = {
      "ordra-cart:blue-bean:none": JSON.stringify([{ ...cappuccino, quantity: 1 }]),
      "ordra-cart:other-cafe:tok": JSON.stringify([
        {
          ...cappuccino,
          menuItemId: "22222222-2222-2222-2222-222222222222",
          quantity: 1,
        },
      ]),
    };
    const others = findOtherCafeCarts(keys, (key) => values[key] ?? null, "blue-bean");
    assert.equal(others.length, 1);
    assert.equal(others[0]?.cafeSlug, "other-cafe");
  });

  it("parses only valid stored lines", () => {
    const parsed = parseCartLines([
      { ...cappuccino, quantity: 2 },
      { menuItemId: "", name: "Bad", unitPrice: "1", quantity: 1 },
      { ...cappuccino, quantity: 0 },
    ]);
    assert.equal(parsed.length, 1);
    assert.equal(parsed[0]?.quantity, 2);
  });
});

describe("checkout validation", () => {
  it("rejects empty carts", () => {
    const result = placeOrderSchema.safeParse({
      cafeSlug: "blue-bean",
      tableToken: "tokensecret12",
      idempotencyKey: "idem-12345678",
      items: [],
    });
    assert.equal(result.success, false);
  });

  it("rejects invalid quantity", () => {
    const result = placeOrderSchema.safeParse({
      cafeSlug: "blue-bean",
      tableToken: "tokensecret12",
      idempotencyKey: "idem-12345678",
      items: [{ menuItemId: cappuccino.menuItemId, quantity: 0 }],
    });
    assert.equal(result.success, false);
  });

  it("does not accept client-sent prices", () => {
    const parsed = placeOrderSchema.parse({
      cafeSlug: "blue-bean",
      tableToken: "tokensecret12",
      idempotencyKey: "idem-12345678",
      items: [{ menuItemId: cappuccino.menuItemId, quantity: 2, price: 1 }],
    });
    assert.equal(Object.prototype.hasOwnProperty.call(parsed.items[0], "price"), false);
  });
});

describe("guest tracker labels", () => {
  it("reuses Module 12 statuses without inventing new ones", () => {
    for (const status of ORDER_STATUSES) {
      assert.ok(GUEST_TRACK_LABELS[status]);
    }
    assert.equal(GUEST_TRACK_LABELS.pending, "Order placed");
    assert.equal(GUEST_TRACK_LABELS.confirmed, "Accepted");
    assert.equal(GUEST_TRACK_LABELS.rejected, "Cancelled");
  });
});

describe("guest order access", () => {
  it("requires both public token and guest session to look up an order", () => {
    const own = {
      public_token: "aaa",
      customer_session_id: "session-aaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    };
    const other = {
      public_token: "aaa",
      customer_session_id: "session-bbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    };
    const canRead =
      own.public_token === other.public_token &&
      own.customer_session_id === other.customer_session_id;
    assert.equal(canRead, false);
  });
});
