import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { classifyOnboardingState } from "../state";

describe("classifyOnboardingState", () => {
  it("marks unauthenticated users", () => {
    assert.equal(
      classifyOnboardingState({ authenticated: false, membershipCount: 0 }),
      "UNAUTHENTICATED",
    );
  });

  it("marks authenticated users without cafes", () => {
    assert.equal(
      classifyOnboardingState({ authenticated: true, membershipCount: 0 }),
      "AUTHENTICATED_NO_CAFE",
    );
  });

  it("marks authenticated users with cafes", () => {
    assert.equal(
      classifyOnboardingState({ authenticated: true, membershipCount: 2 }),
      "AUTHENTICATED_WITH_CAFE",
    );
  });
});
