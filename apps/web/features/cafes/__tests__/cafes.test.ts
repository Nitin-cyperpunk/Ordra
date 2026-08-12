import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { mapCafeError } from "../errors";
import {
  createCafeSchema,
  openingHoursSchema,
  slugifyCafeName,
  updateCafeBusinessSchema,
  updateCafeProfileSchema,
  updateCafeSchema,
} from "../schemas";
import { cafeLogoObjectPath } from "../storage";

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

describe("updateCafeProfileSchema", () => {
  const base = {
    id: "11111111-1111-1111-1111-111111111111",
    name: "Harbor Roast",
    description: "Specialty coffee",
    phone: "+91 98765 43210",
    email: "hello@harbor.test",
    website: "https://harbor.test",
    address_line1: "12 Bean St",
    address_line2: "",
    city: "Mumbai",
    state: "MH",
    country: "IN",
    postal_code: "400001",
  };

  it("accepts a valid profile", () => {
    const result = updateCafeProfileSchema.safeParse(base);
    assert.equal(result.success, true);
  });

  it("rejects invalid email", () => {
    const result = updateCafeProfileSchema.safeParse({
      ...base,
      email: "not-an-email",
    });
    assert.equal(result.success, false);
  });

  it("rejects invalid website", () => {
    const result = updateCafeProfileSchema.safeParse({
      ...base,
      website: "not-a-url",
    });
    assert.equal(result.success, false);
  });
});

describe("updateCafeBusinessSchema", () => {
  it("accepts IANA timezone and ISO currency", () => {
    const result = updateCafeBusinessSchema.safeParse({
      id: "11111111-1111-1111-1111-111111111111",
      timezone: "Asia/Kolkata",
      currency: "inr",
      status: "active",
    });
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.currency, "INR");
    }
  });

  it("rejects invalid timezone", () => {
    const result = updateCafeBusinessSchema.safeParse({
      id: "11111111-1111-1111-1111-111111111111",
      timezone: "India",
      currency: "INR",
      status: "active",
    });
    assert.equal(result.success, false);
  });

  it("rejects invalid currency", () => {
    const result = updateCafeBusinessSchema.safeParse({
      id: "11111111-1111-1111-1111-111111111111",
      timezone: "UTC",
      currency: "RUPEE",
      status: "active",
    });
    assert.equal(result.success, false);
  });
});

describe("openingHoursSchema", () => {
  it("accepts a valid weekly schedule", () => {
    const result = openingHoursSchema.safeParse({
      monday: { closed: false, open: "09:00", close: "18:00" },
      tuesday: { closed: false, open: "09:00", close: "18:00" },
      wednesday: { closed: false, open: "09:00", close: "18:00" },
      thursday: { closed: false, open: "09:00", close: "18:00" },
      friday: { closed: false, open: "09:00", close: "18:00" },
      saturday: { closed: true, open: null, close: null },
      sunday: { closed: true, open: null, close: null },
    });
    assert.equal(result.success, true);
  });

  it("rejects open after close", () => {
    const result = openingHoursSchema.safeParse({
      monday: { closed: false, open: "18:00", close: "09:00" },
      tuesday: { closed: true, open: null, close: null },
      wednesday: { closed: true, open: null, close: null },
      thursday: { closed: true, open: null, close: null },
      friday: { closed: true, open: null, close: null },
      saturday: { closed: true, open: null, close: null },
      sunday: { closed: true, open: null, close: null },
    });
    assert.equal(result.success, false);
  });
});

describe("cafeLogoObjectPath", () => {
  it("builds a tenant-scoped storage path", () => {
    assert.equal(
      cafeLogoObjectPath("cafe-1", "file-1", "png"),
      "cafe/cafe-1/logo/file-1.png",
    );
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
