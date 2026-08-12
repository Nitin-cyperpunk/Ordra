import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { mapMembershipError } from "../errors";
import { membershipSatisfiesRoles } from "../access";
import { inviteMemberSchema, updateMemberRoleSchema } from "../schemas";
import { canEditCafeSettings, canManageMembers, isCafeRole } from "../types";

describe("membership roles", () => {
  it("recognizes supported roles", () => {
    assert.equal(isCafeRole("owner"), true);
    assert.equal(isCafeRole("cashier"), false);
  });

  it("limits management capabilities", () => {
    assert.equal(canManageMembers("owner"), true);
    assert.equal(canManageMembers("manager"), true);
    assert.equal(canManageMembers("staff"), false);
    assert.equal(canEditCafeSettings("staff"), false);
    assert.equal(canEditCafeSettings("manager"), true);
  });
});

describe("inviteMemberSchema", () => {
  it("rejects owner invites", () => {
    const result = inviteMemberSchema.safeParse({
      cafeId: "11111111-1111-1111-1111-111111111111",
      email: "a@b.com",
      role: "owner",
    });
    assert.equal(result.success, false);
  });

  it("accepts manager invites", () => {
    const result = inviteMemberSchema.safeParse({
      cafeId: "11111111-1111-1111-1111-111111111111",
      email: "a@b.com",
      role: "manager",
    });
    assert.equal(result.success, true);
  });
});

describe("updateMemberRoleSchema", () => {
  it("rejects promoting to owner via role update", () => {
    const result = updateMemberRoleSchema.safeParse({
      membershipId: "11111111-1111-1111-1111-111111111111",
      cafeId: "22222222-2222-2222-2222-222222222222",
      role: "owner",
    });
    assert.equal(result.success, false);
  });
});

describe("membershipSatisfiesRoles", () => {
  it("allows any role when unrestricted", () => {
    assert.equal(membershipSatisfiesRoles("staff"), true);
  });

  it("enforces required roles for owner-only operations", () => {
    assert.equal(membershipSatisfiesRoles("owner", ["owner"]), true);
    assert.equal(membershipSatisfiesRoles("staff", ["owner"]), false);
  });
});

describe("mapMembershipError", () => {
  it("maps unique violations", () => {
    assert.match(
      mapMembershipError({ code: "23505", message: "duplicate key" }),
      /already exists/i,
    );
  });

  it("maps RLS denials", () => {
    assert.match(
      mapMembershipError({ message: "row-level security policy" }),
      /permission/i,
    );
  });
});
