import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { mapWaitlistError } from "../errors";
import { waitlistSchema } from "../schemas";

describe("waitlistSchema", () => {
  const valid = {
    cafeName: "Harbor Roast",
    ownerName: "Nitin Singh",
    phone: "+919876543210",
    cafeAddress: "12 Bean Street, Mumbai",
    email: "owner@harbor.test",
  };

  it("accepts a valid submission", () => {
    const result = waitlistSchema.safeParse(valid);
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.email, "owner@harbor.test");
      assert.equal(result.data.phone, "+919876543210");
    }
  });

  it("rejects invalid email", () => {
    const result = waitlistSchema.safeParse({ ...valid, email: "nope" });
    assert.equal(result.success, false);
  });

  it("rejects invalid Indian phone", () => {
    const result = waitlistSchema.safeParse({ ...valid, phone: "12345" });
    assert.equal(result.success, false);
  });

  it("normalizes phone spacing", () => {
    const result = waitlistSchema.safeParse({
      ...valid,
      phone: "+91 98765 43210",
    });
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.phone, "+919876543210");
    }
  });

  it("requires cafe name length", () => {
    const result = waitlistSchema.safeParse({ ...valid, cafeName: "A" });
    assert.equal(result.success, false);
  });
});

describe("mapWaitlistError", () => {
  it("maps unique violations to a friendly duplicate message", () => {
    assert.match(
      mapWaitlistError({ code: "23505", message: "duplicate key" }),
      /already on the list/i,
    );
  });

  it("hides internal errors", () => {
    assert.equal(
      mapWaitlistError({ message: "permission denied for table waitlist" }),
      "Something went wrong. Please try again.",
    );
  });
});
