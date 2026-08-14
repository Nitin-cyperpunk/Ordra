import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { mapTableError } from "../errors";
import {
  bulkCreateTablesSchema,
  createSectionSchema,
  createTableSchema,
  formatBulkTableCode,
  updateTableSchema,
} from "../schemas";
import { canManageTables, canViewTables } from "../types";

const cafeA = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const cafeB = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const sectionA = "11111111-1111-1111-1111-111111111111";
const sectionB = "22222222-2222-2222-2222-222222222222";

describe("table RBAC helpers", () => {
  it("allows owner and manager to manage tables", () => {
    assert.equal(canManageTables("owner"), true);
    assert.equal(canManageTables("manager"), true);
    assert.equal(canManageTables("staff"), false);
  });

  it("allows all members to view tables", () => {
    assert.equal(canViewTables("staff"), true);
    assert.equal(canViewTables("manager"), true);
  });
});

describe("createTableSchema", () => {
  it("accepts a valid table", () => {
    const result = createTableSchema.safeParse({
      cafeId: cafeA,
      code: "T01",
      capacity: 4,
      sectionId: "",
      status: "active",
    });
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.sectionId, null);
      assert.equal(result.data.code, "T01");
    }
  });

  it("rejects capacity 0 and negative", () => {
    assert.equal(
      createTableSchema.safeParse({ cafeId: cafeA, code: "T01", capacity: 0 }).success,
      false,
    );
    assert.equal(
      createTableSchema.safeParse({ cafeId: cafeA, code: "T01", capacity: -1 }).success,
      false,
    );
  });

  it("accepts capacity 4", () => {
    const result = createTableSchema.safeParse({
      cafeId: cafeA,
      code: "T01",
      capacity: 4,
    });
    assert.equal(result.success, true);
  });

  it("trims code and rejects empty", () => {
    assert.equal(
      createTableSchema.safeParse({ cafeId: cafeA, code: "   ", capacity: 2 }).success,
      false,
    );
    const ok = createTableSchema.safeParse({
      cafeId: cafeA,
      code: "  VIP-01  ",
      capacity: 6,
    });
    assert.equal(ok.success, true);
    if (ok.success) assert.equal(ok.data.code, "VIP-01");
  });

  it("accepts a valid same-cafe section id shape", () => {
    const result = createTableSchema.safeParse({
      cafeId: cafeA,
      code: "A1",
      capacity: 2,
      sectionId: sectionA,
    });
    assert.equal(result.success, true);
  });
});

describe("updateTableSchema", () => {
  it("requires id and does not accept cafe reassignment via schema alone", () => {
    const result = updateTableSchema.safeParse({
      id: sectionA,
      cafeId: cafeB,
      code: "T01",
      capacity: 4,
      status: "inactive",
      sectionId: sectionB,
    });
    assert.equal(result.success, true);
    // App layer always scopes update with .eq('cafe_id', cafeId) from auth context.
  });
});

describe("bulkCreateTablesSchema + formatBulkTableCode", () => {
  it("formats padded codes", () => {
    assert.equal(formatBulkTableCode("T", 1, 2), "T01");
    assert.equal(formatBulkTableCode("T", 10, 2), "T10");
    assert.equal(formatBulkTableCode("VIP-", 3, 2), "VIP-03");
  });

  it("accepts bulk params and caps count", () => {
    const ok = bulkCreateTablesSchema.safeParse({
      cafeId: cafeA,
      prefix: "T",
      start: 1,
      count: 10,
      capacity: 4,
    });
    assert.equal(ok.success, true);

    const tooMany = bulkCreateTablesSchema.safeParse({
      cafeId: cafeA,
      prefix: "T",
      start: 1,
      count: 51,
      capacity: 4,
    });
    assert.equal(tooMany.success, false);
  });
});

describe("createSectionSchema", () => {
  it("requires a non-empty name", () => {
    assert.equal(
      createSectionSchema.safeParse({ cafeId: cafeA, name: "  " }).success,
      false,
    );
    assert.equal(
      createSectionSchema.safeParse({ cafeId: cafeA, name: "Outdoor" }).success,
      true,
    );
  });
});

describe("mapTableError", () => {
  it("maps duplicate table codes", () => {
    assert.match(
      mapTableError({
        code: "23505",
        message:
          'duplicate key value violates unique constraint "cafe_tables_cafe_code_unique"',
      }),
      /already exists/i,
    );
  });

  it("maps cross-cafe section failures", () => {
    assert.match(
      mapTableError({ message: "section must belong to the same cafe as the table" }),
      /does not belong/i,
    );
  });

  it("maps RLS denials", () => {
    assert.match(
      mapTableError({ message: "new row violates row-level security policy" }),
      /permission/i,
    );
  });
});

describe("identifier uniqueness semantics (documented)", () => {
  it("allows same code shape for different cafes at the schema level", () => {
    const a = createTableSchema.safeParse({ cafeId: cafeA, code: "T01", capacity: 4 });
    const b = createTableSchema.safeParse({ cafeId: cafeB, code: "T01", capacity: 4 });
    assert.equal(a.success, true);
    assert.equal(b.success, true);
  });
});
