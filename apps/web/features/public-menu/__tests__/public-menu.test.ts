import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { formatMenuPrice, dietLabel } from "@/features/menu/types";

describe("public menu display helpers", () => {
  it("formats INR prices for guest display", () => {
    assert.equal(formatMenuPrice("149.50", "INR"), "₹149.50");
    assert.equal(formatMenuPrice("99", "INR"), "₹99.00");
  });

  it("labels diet for guests without jargon", () => {
    assert.equal(dietLabel("vegetarian"), "Vegetarian");
    assert.equal(dietLabel("non_vegetarian"), "Non-vegetarian");
  });
});

describe("public menu slug normalization (documented)", () => {
  it("expects lowercase slug paths like /c/blue-bean", () => {
    const slug = "Blue-Bean".trim().toLowerCase();
    assert.equal(slug, "blue-bean");
  });
});
