import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildCafeMenuUrl, buildQrDownloadBasename, buildTableMenuUrl } from "../urls";

describe("QR public URLs", () => {
  it("builds cafe and table menu URLs from NEXT_PUBLIC_APP_URL", () => {
    const previous = process.env.NEXT_PUBLIC_APP_URL;
    process.env.NEXT_PUBLIC_APP_URL = "https://ordra.example/";

    try {
      assert.equal(buildCafeMenuUrl("Blue-Bean"), "https://ordra.example/c/blue-bean");
      assert.equal(
        buildTableMenuUrl("blue-bean", "t_8F4k29x"),
        "https://ordra.example/c/blue-bean?table=t_8F4k29x",
      );
    } finally {
      if (previous === undefined) {
        delete process.env.NEXT_PUBLIC_APP_URL;
      } else {
        process.env.NEXT_PUBLIC_APP_URL = previous;
      }
    }
  });

  it("builds download basenames from cafe slug and table code (not DB UUIDs)", () => {
    assert.equal(
      buildQrDownloadBasename({ cafeSlug: "blue-bean", tableCode: "12" }),
      "ordra-blue-bean-table-12",
    );
    assert.equal(
      buildQrDownloadBasename({ cafeSlug: "Blue Bean" }),
      "ordra-blue-bean-menu",
    );
    assert.equal(
      buildQrDownloadBasename({ cafeSlug: "cafe", tableCode: "T01" }),
      "ordra-cafe-table-t01",
    );
  });

  it("never uses sequential table ids as the public query value helper", () => {
    const previous = process.env.NEXT_PUBLIC_APP_URL;
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
    try {
      const url = buildTableMenuUrl("marshal-cafe", "abc123opaque");
      assert.match(url, /[?&]table=abc123opaque/);
      assert.doesNotMatch(url, /[?&]table=1$/);
    } finally {
      if (previous === undefined) {
        delete process.env.NEXT_PUBLIC_APP_URL;
      } else {
        process.env.NEXT_PUBLIC_APP_URL = previous;
      }
    }
  });
});
