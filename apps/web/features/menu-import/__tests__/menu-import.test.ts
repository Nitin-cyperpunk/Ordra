import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { HeuristicMenuExtractor } from "@/features/menu-import/providers/heuristic-menu-extractor";
import { extractedMenuDraftSchema } from "@/features/menu-import/schemas";
import { menuImportObjectPath } from "@/features/menu-import/storage";
import {
  detectMenuImportMime,
  validateMenuImportFile,
} from "@/features/menu-import/validation";

function fakeFile(name: string, type: string, bytes: Uint8Array): File {
  return {
    name,
    type,
    size: bytes.byteLength,
    arrayBuffer: async () =>
      bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  } as File;
}

describe("menu import validation", () => {
  it("accepts PDF magic bytes", () => {
    const bytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);
    assert.equal(
      detectMenuImportMime(bytes, "application/octet-stream"),
      "application/pdf",
    );
  });

  it("accepts PNG magic bytes", () => {
    const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    assert.equal(detectMenuImportMime(bytes, "image/png"), "image/png");
  });

  it("accepts JPEG magic bytes", () => {
    const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
    assert.equal(detectMenuImportMime(bytes, "image/jpeg"), "image/jpeg");
  });

  it("rejects executable disguised as pdf", () => {
    const bytes = new Uint8Array([0x4d, 0x5a, 0x90, 0x00]); // MZ
    const file = fakeFile("menu.pdf", "application/pdf", bytes);
    const result = validateMenuImportFile(file, bytes);
    assert.equal(result.ok, false);
  });

  it("rejects oversized files", () => {
    const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const file = fakeFile("huge.png", "image/png", bytes);
    Object.defineProperty(file, "size", { value: 11 * 1024 * 1024 });
    const result = validateMenuImportFile(file, bytes);
    // File.size is over limit even if buffer sample is small — validation checks both
    assert.equal(result.ok, false);
  });
});

describe("menu import storage paths", () => {
  it("scopes paths to cafe and import ids", () => {
    const cafeId = "11111111-1111-1111-1111-111111111111";
    const importId = "22222222-2222-2222-2222-222222222222";
    const path = menuImportObjectPath(cafeId, importId, "original.pdf");
    assert.equal(path, `cafe/${cafeId}/imports/${importId}/original.pdf`);
  });

  it("sanitizes unsafe filenames", () => {
    const path = menuImportObjectPath(
      "11111111-1111-1111-1111-111111111111",
      "22222222-2222-2222-2222-222222222222",
      "../../evil.exe",
    );
    assert.ok(!path.includes(".."));
    assert.match(path, /\/evil\.exe$/);
  });
});

describe("heuristic menu extractor", () => {
  it("extracts name and price lines", async () => {
    const extractor = new HeuristicMenuExtractor();
    const draft = await extractor.extract({
      text: ["COFFEE", "Cappuccino 149", "Latte - ₹159", "Snack Bar 99"].join("\n"),
      mime: "application/pdf",
      requiresVision: false,
    });
    const parsed = extractedMenuDraftSchema.parse(draft);
    const items = parsed.categories.flatMap((category) => category.items);
    assert.ok(items.length >= 2);
    assert.ok(
      items.some((item) => item.name.includes("Cappuccino") && item.price === 149),
    );
    assert.ok(items.every((item) => item.selected));
  });

  it("does not invent prices", async () => {
    const extractor = new HeuristicMenuExtractor();
    const draft = await extractor.extract({
      text: "Mystery Drink\nAnother Line Without Price",
      mime: "text/plain",
      requiresVision: false,
    });
    const items = draft.categories.flatMap((category) => category.items);
    assert.equal(items.length, 0);
  });
});

describe("extracted menu schema", () => {
  it("rejects arbitrary AI json", () => {
    const result = extractedMenuDraftSchema.safeParse({
      categories: [{ name: "X", items: [{ name: "Y" }] }],
    });
    assert.equal(result.success, false);
  });
});
