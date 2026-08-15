import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { isThemePreference, resolveTheme } from "@/lib/theme";

describe("theme preference", () => {
  it("defaults resolution: system follows OS", () => {
    assert.equal(resolveTheme("system", true), "dark");
    assert.equal(resolveTheme("system", false), "light");
  });

  it("supports future manual light/dark overrides", () => {
    assert.equal(resolveTheme("light", true), "light");
    assert.equal(resolveTheme("dark", false), "dark");
  });

  it("validates preference values", () => {
    assert.equal(isThemePreference("system"), true);
    assert.equal(isThemePreference("light"), true);
    assert.equal(isThemePreference("dark"), true);
    assert.equal(isThemePreference("auto"), false);
    assert.equal(isThemePreference(null), false);
  });
});
