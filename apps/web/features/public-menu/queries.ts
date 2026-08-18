import "server-only";

import { createClient } from "@/lib/supabase/server";
import type {
  PublicCafe,
  PublicMenu,
  PublicMenuCategory,
  PublicMenuItem,
  PublicTableContext,
} from "@/features/public-menu/types";
import {
  PUBLIC_CAFE_COLUMNS,
  PUBLIC_TABLE_COLUMNS,
} from "@/features/public-menu/contract";
import type { MenuItemDiet } from "@/features/menu/types";

export {
  PRIVATE_CAFE_FIELDS,
  PRIVATE_TABLE_FIELDS,
  PUBLIC_CAFE_COLUMNS,
  PUBLIC_TABLE_COLUMNS,
} from "@/features/public-menu/contract";

const CATEGORY_PUBLIC_COLUMNS =
  "id, name, description, display_order, is_active" as const;

const ITEM_PUBLIC_COLUMNS =
  "id, category_id, name, description, price, image_path, diet, display_order, is_available" as const;

function mapCafe(row: Record<string, unknown>): PublicCafe {
  return {
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    description: (row.description as string | null) ?? null,
    logo_url: (row.logo_url as string | null) ?? null,
    currency: String(row.currency ?? "INR"),
    city: (row.city as string | null) ?? null,
  };
}

function mapCategory(row: Record<string, unknown>): PublicMenuCategory {
  return {
    id: String(row.id),
    name: String(row.name),
    description: (row.description as string | null) ?? null,
    display_order: Number(row.display_order ?? 0),
  };
}

function mapItem(row: Record<string, unknown>): PublicMenuItem {
  return {
    id: String(row.id),
    category_id: String(row.category_id),
    name: String(row.name),
    description: (row.description as string | null) ?? null,
    price: String(row.price),
    image_path: (row.image_path as string | null) ?? null,
    diet: row.diet as MenuItemDiet,
    display_order: Number(row.display_order ?? 0),
    is_available: row.is_available !== false,
  };
}

/**
 * Resolve active table context for a cafe.
 * Requires: same cafe_id + matching public_token + active (view filter).
 * Cross-cafe tokens never resolve.
 */
export async function resolvePublicTableContext(
  cafeId: string,
  tableToken: string | null | undefined,
): Promise<{ table: PublicTableContext | null; tableUnavailable: boolean }> {
  const token = tableToken?.trim() ?? "";
  if (!token) {
    return { table: null, tableUnavailable: false };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("public_cafe_tables")
    .select(PUBLIC_TABLE_COLUMNS)
    .eq("cafe_id", cafeId)
    .eq("public_token", token)
    .maybeSingle();

  if (error || !data) {
    return { table: null, tableUnavailable: true };
  }

  return {
    table: {
      code: String((data as Record<string, unknown>).code),
      publicToken: token,
    },
    tableUnavailable: false,
  };
}

/**
 * Load an active cafe's public digital menu by slug.
 * Optional tableToken attaches informational table context only (no orders).
 */
export async function getPublicMenuBySlug(
  slug: string,
  tableToken?: string | null,
): Promise<PublicMenu | null> {
  const normalized = slug.trim().toLowerCase();
  if (!normalized) return null;

  const supabase = await createClient();

  const { data: cafeRow, error: cafeError } = await supabase
    .from("public_cafes")
    .select(PUBLIC_CAFE_COLUMNS)
    .eq("slug", normalized)
    .maybeSingle();

  if (cafeError) {
    throw new Error("Unable to load cafe menu.");
  }

  if (!cafeRow) return null;

  const cafe = mapCafe(cafeRow as Record<string, unknown>);
  const tableResult = await resolvePublicTableContext(cafe.id, tableToken);

  const [
    { data: categoryRows, error: categoryError },
    { data: itemRows, error: itemError },
  ] = await Promise.all([
    supabase
      .from("menu_categories")
      .select(CATEGORY_PUBLIC_COLUMNS)
      .eq("cafe_id", cafe.id)
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("menu_items")
      .select(ITEM_PUBLIC_COLUMNS)
      .eq("cafe_id", cafe.id)
      .order("display_order", { ascending: true })
      .order("name", { ascending: true }),
  ]);

  if (categoryError || itemError) {
    throw new Error("Unable to load cafe menu.");
  }

  return {
    cafe,
    categories: (categoryRows ?? []).map((row) =>
      mapCategory(row as Record<string, unknown>),
    ),
    items: (itemRows ?? []).map((row) => mapItem(row as Record<string, unknown>)),
    table: tableResult.table,
    tableUnavailable: tableResult.tableUnavailable,
  };
}
