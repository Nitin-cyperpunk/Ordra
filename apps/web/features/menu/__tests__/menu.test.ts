import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { mapMenuError } from "../errors";
import {
  createCategorySchema,
  createItemSchema,
  menuPriceSchema,
  updateItemSchema,
} from "../schemas";
import {
  isAllowedMenuImageMime,
  menuItemImageObjectPath,
  MENU_IMAGE_MAX_BYTES,
} from "../storage";
import { canManageMenu, canViewMenu, formatMenuPrice } from "../types";

const cafeA = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const cafeB = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const categoryA = "11111111-1111-1111-1111-111111111111";

describe("menu RBAC helpers", () => {
  it("limits management to owner and manager", () => {
    assert.equal(canManageMenu("owner"), true);
    assert.equal(canManageMenu("manager"), true);
    assert.equal(canManageMenu("staff"), false);
    assert.equal(canViewMenu("staff"), true);
  });
});

describe("menuPriceSchema", () => {
  it("accepts whole rupees and paise", () => {
    assert.equal(menuPriceSchema.safeParse("99").success, true);
    assert.equal(menuPriceSchema.safeParse("149.50").success, true);
    assert.equal(menuPriceSchema.safeParse("999.00").success, true);
  });

  it("rejects zero, negative, and invalid decimals", () => {
    assert.equal(menuPriceSchema.safeParse("0").success, false);
    assert.equal(menuPriceSchema.safeParse("0.00").success, false);
    assert.equal(menuPriceSchema.safeParse("-1").success, false);
    assert.equal(menuPriceSchema.safeParse("12.345").success, false);
    assert.equal(menuPriceSchema.safeParse("abc").success, false);
  });
});

describe("createCategorySchema", () => {
  it("requires a trimmed name", () => {
    assert.equal(
      createCategorySchema.safeParse({ cafeId: cafeA, name: "  " }).success,
      false,
    );
    assert.equal(
      createCategorySchema.safeParse({ cafeId: cafeA, name: "Coffee" }).success,
      true,
    );
  });
});

describe("createItemSchema", () => {
  it("accepts a valid item", () => {
    const result = createItemSchema.safeParse({
      cafeId: cafeA,
      categoryId: categoryA,
      name: "Cappuccino",
      description: "Rich espresso with steamed milk",
      price: "149.50",
      diet: "vegetarian",
      isAvailable: "true",
    });
    assert.equal(result.success, true);
  });

  it("rejects missing category and invalid price", () => {
    assert.equal(
      createItemSchema.safeParse({
        cafeId: cafeA,
        categoryId: "not-a-uuid",
        name: "Tea",
        price: "40",
        diet: "vegetarian",
      }).success,
      false,
    );
    assert.equal(
      createItemSchema.safeParse({
        cafeId: cafeA,
        categoryId: categoryA,
        name: "Tea",
        price: "0",
        diet: "vegetarian",
      }).success,
      false,
    );
  });
});

describe("updateItemSchema", () => {
  it("keeps cafeId as an explicit field for server scoping", () => {
    const result = updateItemSchema.safeParse({
      id: categoryA,
      cafeId: cafeB,
      categoryId: categoryA,
      name: "Latte",
      price: "160",
      diet: "vegetarian",
      isAvailable: "false",
    });
    assert.equal(result.success, true);
  });
});

describe("storage helpers", () => {
  it("builds tenant-scoped menu image paths", () => {
    const path = menuItemImageObjectPath(cafeA, categoryA, "file-1", "image/jpeg");
    assert.equal(path, `cafe/${cafeA}/menu/${categoryA}/file-1.jpg`);
    assert.match(path, /^cafe\//);
  });

  it("validates mime types and size constant", () => {
    assert.equal(isAllowedMenuImageMime("image/png"), true);
    assert.equal(isAllowedMenuImageMime("image/heic"), false);
    assert.equal(MENU_IMAGE_MAX_BYTES, 2 * 1024 * 1024);
  });
});

describe("formatMenuPrice", () => {
  it("formats INR without using float math for display of validated strings", () => {
    assert.equal(formatMenuPrice("149.50"), "₹149.50");
    assert.equal(formatMenuPrice("99"), "₹99.00");
  });
});

describe("mapMenuError", () => {
  it("maps duplicate category and cross-cafe category failures", () => {
    assert.match(
      mapMenuError({
        code: "23505",
        message:
          'duplicate key value violates unique constraint "menu_categories_cafe_name_unique"',
      }),
      /already exists/i,
    );
    assert.match(
      mapMenuError({ message: "category must belong to the same cafe as the menu item" }),
      /does not belong/i,
    );
  });

  it("maps FK delete conflicts and RLS", () => {
    assert.match(
      mapMenuError({ code: "23503", message: "foreign key" }),
      /still has menu items/i,
    );
    assert.match(mapMenuError({ message: "row-level security policy" }), /permission/i);
  });
});
