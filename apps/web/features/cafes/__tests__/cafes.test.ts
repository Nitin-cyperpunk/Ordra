import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { mapCafeError } from "../errors";
import { createCafeSchema, slugifyCafeName, updateCafeSchema } from "../schemas";

describe("slugifyCafeName", () => {
  it("normalizes names into slugs", () => {
    assert.equal(slugifyCafeName("Harbor Roast Café"), "harbor-roast-cafe");
  });

  it("collapses punctuation and spaces", () => {
    assert.equal(slugifyCafeName("  Bean & Leaf!! "), "bean-leaf");
  });
});

describe("createCafeSchema", () => {
  it("accepts a valid cafe", () => {
    const result = createCafeSchema.safeParse({
      name: "Harbor Roast",
      slug: "harbor-roast",
    });
    assert.equal(result.success, true);
  });

  it("rejects an invalid slug", () => {
    const result = createCafeSchema.safeParse({
      name: "Harbor Roast",
      slug: "Harbor_Roast",
    });
    assert.equal(result.success, false);
  });

  it("lowercases slug input", () => {
    const result = createCafeSchema.safeParse({
      name: "Harbor Roast",
      slug: "Harbor-Roast",
    });
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.slug, "harbor-roast");
    }
  });
});

describe("updateCafeSchema", () => {
  it("requires a uuid id", () => {
    const result = updateCafeSchema.safeParse({
      id: "not-a-uuid",
      name: "Harbor Roast",
      slug: "harbor-roast",
    });
    assert.equal(result.success, false);
  });
});

describe("mapCafeError", () => {
  it("maps duplicate slug errors", () => {
    assert.match(
      mapCafeError({ code: "23505", message: "duplicate key value" }),
      /slug is already taken/i,
    );
  });

  it("maps RLS denials", () => {
    assert.match(
      mapCafeError({ message: "new row violates row-level security policy" }),
      /do not have permission/i,
    );
  });
});
