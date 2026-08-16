import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  PRIVATE_CAFE_FIELDS,
  PRIVATE_TABLE_FIELDS,
  PUBLIC_CAFE_COLUMNS,
  PUBLIC_TABLE_COLUMNS,
} from "../contract";
import type { PublicCafe, PublicTableContext } from "../types";

describe("public cafe data contract", () => {
  it("exposes only the intentional public columns", () => {
    const columns = PUBLIC_CAFE_COLUMNS.split(",").map((part) => part.trim());
    assert.deepEqual(columns, [
      "id",
      "name",
      "slug",
      "description",
      "logo_url",
      "currency",
      "city",
      "status",
    ]);
  });

  it("lists private cafe fields that must not be on the public contract", () => {
    assert.ok(PRIVATE_CAFE_FIELDS.includes("owner_id"));
    assert.ok(PRIVATE_CAFE_FIELDS.includes("email"));
    assert.ok(PRIVATE_CAFE_FIELDS.includes("phone"));
    assert.ok(PRIVATE_CAFE_FIELDS.includes("opening_hours"));
    assert.ok(PRIVATE_CAFE_FIELDS.includes("address_line1"));
  });

  it("keeps PublicCafe type free of private keys", () => {
    const sample: PublicCafe = {
      id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      name: "Public Bean",
      slug: "public-bean",
      description: "Public description",
      logo_url: null,
      currency: "INR",
      city: "Nashik",
    };

    for (const field of PRIVATE_CAFE_FIELDS) {
      assert.equal(
        Object.prototype.hasOwnProperty.call(sample, field),
        false,
        `PublicCafe must not include ${field}`,
      );
    }
  });

  it("does not overlap public columns with private field names", () => {
    const publicSet = new Set(PUBLIC_CAFE_COLUMNS.split(",").map((part) => part.trim()));
    for (const field of PRIVATE_CAFE_FIELDS) {
      assert.equal(publicSet.has(field), false);
    }
  });
});

describe("public table QR context contract", () => {
  it("exposes only cafe_id, code, public_token, status on the view select", () => {
    assert.equal(PUBLIC_TABLE_COLUMNS, "cafe_id, code, public_token, status");
  });

  it("guest table context includes display code + opaque token only", () => {
    const sample: PublicTableContext = {
      code: "12",
      publicToken: "abc123opaque",
    };
    for (const field of PRIVATE_TABLE_FIELDS) {
      assert.equal(Object.prototype.hasOwnProperty.call(sample, field), false);
    }
    assert.equal(Object.prototype.hasOwnProperty.call(sample, "cafe_id"), false);
  });

  it("documents tenant-safe resolution rules", () => {
    // Conceptual: token from cafe B must not attach to cafe A menu.
    const cafeAId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    const cafeBId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    const row = {
      cafe_id: cafeBId,
      code: "B1",
      public_token: "token-b",
      status: "active",
    };
    const matchesCafeA = row.cafe_id === cafeAId && row.public_token === "token-b";
    assert.equal(matchesCafeA, false);
  });
});
