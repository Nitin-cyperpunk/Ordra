import type { MenuItemDiet } from "@/features/menu/types";

/** Public-safe cafe fields for the digital menu. */
export type PublicCafe = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  currency: string;
  city: string | null;
};

/** Guest-facing table context from QR (no internal ids). */
export type PublicTableContext = {
  code: string;
  /** Opaque public_token from the QR query — for cart/order binding only. */
  publicToken: string;
};

export type PublicMenuCategory = {
  id: string;
  name: string;
  description: string | null;
  display_order: number;
};

export type PublicMenuItem = {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: string;
  image_path: string | null;
  diet: MenuItemDiet;
  display_order: number;
};

export type PublicMenu = {
  cafe: PublicCafe;
  categories: PublicMenuCategory[];
  items: PublicMenuItem[];
  /** Set when ?table= resolves to an active table for this cafe. */
  table: PublicTableContext | null;
  /**
   * True when a table query param was present but could not be resolved
   * (unknown, inactive, or belongs to another cafe).
   */
  tableUnavailable: boolean;
};
