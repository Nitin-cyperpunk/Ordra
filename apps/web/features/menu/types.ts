import type { CafeRole } from "@/features/memberships/types";

export const MENU_ITEM_DIETS = ["vegetarian", "non_vegetarian"] as const;
export type MenuItemDiet = (typeof MENU_ITEM_DIETS)[number];

export type MenuCategory = {
  id: string;
  cafe_id: string;
  name: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type MenuItem = {
  id: string;
  cafe_id: string;
  category_id: string;
  name: string;
  description: string | null;
  /** NUMERIC(10,2) as string from Postgres — never treat as JS float for math. */
  price: string;
  image_path: string | null;
  diet: MenuItemDiet;
  is_available: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  category?: MenuCategory | null;
};

export const MENU_CATEGORY_SELECT_COLUMNS =
  "id, cafe_id, name, description, display_order, is_active, created_at, updated_at" as const;

export const MENU_ITEM_SELECT_COLUMNS =
  "id, cafe_id, category_id, name, description, price, image_path, diet, is_available, display_order, created_at, updated_at" as const;

export function canManageMenu(role: CafeRole): boolean {
  return role === "owner" || role === "manager";
}

export function canViewMenu(role: CafeRole): boolean {
  return role === "owner" || role === "manager" || role === "staff";
}

/** Display helper — formatting only; do not use for arithmetic. */
export function formatMenuPrice(price: string, currency = "INR"): string {
  const normalized = price.includes(".") ? price : `${price}.00`;
  if (currency === "INR") {
    return `₹${normalized}`;
  }
  return `${currency} ${normalized}`;
}

export function dietLabel(diet: MenuItemDiet): string {
  return diet === "vegetarian" ? "Vegetarian" : "Non-vegetarian";
}
