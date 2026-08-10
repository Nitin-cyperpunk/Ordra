import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { mapAuthError } from "../errors";
import { loginSchema, signupSchema } from "../schemas";

describe("loginSchema", () => {
  it("accepts a valid email and password", () => {
    const result = loginSchema.safeParse({
      email: "owner@cafe.test",
      password: "secret123",
    });
    assert.equal(result.success, true);
  });

  it("rejects an invalid email", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "secret123",
    });
    assert.equal(result.success, false);
  });

  it("rejects an empty password", () => {
    const result = loginSchema.safeParse({
      email: "owner@cafe.test",
      password: "",
    });
    assert.equal(result.success, false);
  });
});

describe("signupSchema", () => {
  it("accepts a strong matching password pair", () => {
    const result = signupSchema.safeParse({
      fullName: "Ada Lovelace",
      email: "ada@cafe.test",
      password: "secure9pass",
      confirmPassword: "secure9pass",
    });
    assert.equal(result.success, true);
  });

  it("rejects mismatched passwords", () => {
    const result = signupSchema.safeParse({
      fullName: "Ada Lovelace",
      email: "ada@cafe.test",
      password: "secure9pass",
      confirmPassword: "different9",
    });
    assert.equal(result.success, false);
    if (!result.success) {
      assert.ok(
        result.error.flatten().fieldErrors.confirmPassword?.length,
        "expected confirmPassword error",
      );
    }
  });

  it("rejects a weak password without a number", () => {
    const result = signupSchema.safeParse({
      fullName: "Ada Lovelace",
      email: "ada@cafe.test",
      password: "abcdefgh",
      confirmPassword: "abcdefgh",
    });
    assert.equal(result.success, false);
  });

  it("rejects a short full name", () => {
    const result = signupSchema.safeParse({
      fullName: "A",
      email: "ada@cafe.test",
      password: "secure9pass",
      confirmPassword: "secure9pass",
    });
    assert.equal(result.success, false);
  });
});

describe("mapAuthError", () => {
  it("maps invalid credentials", () => {
    assert.equal(
      mapAuthError({ message: "Invalid login credentials" }),
      "Invalid email or password.",
    );
  });

  it("maps unverified email", () => {
    assert.match(mapAuthError({ message: "Email not confirmed" }), /verify your email/i);
  });

  it("maps existing account", () => {
    assert.match(mapAuthError({ message: "User already registered" }), /already exists/i);
  });

  it("hides unknown internals", () => {
    assert.equal(
      mapAuthError({ message: "postgres connection refused on host xyz" }),
      "Unable to complete authentication. Please try again.",
    );
  });
});
