"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";

import { requireCafeAccess } from "@/features/memberships/access";
import { mapMenuError } from "@/features/menu/errors";
import {
  createCategorySchema,
  createItemSchema,
  deleteCategorySchema,
  deleteItemSchema,
  removeItemImageSchema,
  reorderCategorySchema,
  reorderItemSchema,
  setCategoryActiveSchema,
  setItemAvailabilitySchema,
  updateCategorySchema,
  updateItemSchema,
  uploadItemImageSchema,
} from "@/features/menu/schemas";
import {
  CAFE_ASSETS_BUCKET,
  isAllowedMenuImageMime,
  MENU_IMAGE_MAX_BYTES,
  menuItemImageObjectPath,
} from "@/features/menu/storage";
import {
  canManageMenu,
  MENU_CATEGORY_SELECT_COLUMNS,
  MENU_ITEM_SELECT_COLUMNS,
  type MenuCategory,
  type MenuItem,
  type MenuItemDiet,
} from "@/features/menu/types";
import { createClient } from "@/lib/supabase/server";

export type MenuActionState = {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string[]>;
};

function revalidateMenu(cafeId: string) {
  revalidatePath(`/dashboard/cafes/${cafeId}/menu`);
  revalidatePath(`/dashboard/cafes/${cafeId}`);
}

function mapCategoryRow(row: Record<string, unknown>): MenuCategory {
  return {
    id: String(row.id),
    cafe_id: String(row.cafe_id),
    name: String(row.name),
    description: (row.description as string | null) ?? null,
    display_order: Number(row.display_order ?? 0),
    is_active: Boolean(row.is_active),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

function mapItemRow(row: Record<string, unknown>): MenuItem {
  const categoryRaw = row.menu_categories;
  let category: MenuCategory | null = null;
  if (categoryRaw && typeof categoryRaw === "object" && !Array.isArray(categoryRaw)) {
    category = mapCategoryRow(categoryRaw as Record<string, unknown>);
  }

  return {
    id: String(row.id),
    cafe_id: String(row.cafe_id),
    category_id: String(row.category_id),
    name: String(row.name),
    description: (row.description as string | null) ?? null,
    price: String(row.price),
    image_path: (row.image_path as string | null) ?? null,
    diet: row.diet as MenuItemDiet,
    is_available: Boolean(row.is_available),
    display_order: Number(row.display_order ?? 0),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    category,
  };
}

export type ListMenuItemsOptions = {
  categoryId?: string | "all";
  availability?: "all" | "available" | "unavailable";
  diet?: "all" | MenuItemDiet;
  q?: string;
};

export async function listMenuCategories(cafeId: string): Promise<MenuCategory[]> {
  await requireCafeAccess(cafeId);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("menu_categories")
    .select(MENU_CATEGORY_SELECT_COLUMNS)
    .eq("cafe_id", cafeId)
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw new Error(mapMenuError(error));
  return (data ?? []).map((row) => mapCategoryRow(row as Record<string, unknown>));
}

export async function listMenuItems(
  cafeId: string,
  options: ListMenuItemsOptions = {},
): Promise<MenuItem[]> {
  await requireCafeAccess(cafeId);
  const supabase = await createClient();

  let query = supabase
    .from("menu_items")
    .select(
      `${MENU_ITEM_SELECT_COLUMNS}, menu_categories ( ${MENU_CATEGORY_SELECT_COLUMNS} )`,
    )
    .eq("cafe_id", cafeId)
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });

  if (options.categoryId && options.categoryId !== "all") {
    query = query.eq("category_id", options.categoryId);
  }

  if (options.availability === "available") {
    query = query.eq("is_available", true);
  } else if (options.availability === "unavailable") {
    query = query.eq("is_available", false);
  }

  if (options.diet && options.diet !== "all") {
    query = query.eq("diet", options.diet);
  }

  if (options.q?.trim()) {
    query = query.or(
      `name.ilike.%${options.q.trim()}%,description.ilike.%${options.q.trim()}%`,
    );
  }

  const { data, error } = await query;
  if (error) throw new Error(mapMenuError(error));
  return (data ?? []).map((row) => mapItemRow(row as Record<string, unknown>));
}

async function assertCategoryBelongsToCafe(
  cafeId: string,
  categoryId: string,
): Promise<MenuActionState | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("menu_categories")
    .select("id")
    .eq("id", categoryId)
    .eq("cafe_id", cafeId)
    .maybeSingle();

  if (error) return { error: mapMenuError(error) };
  if (!data) return { error: "That category does not belong to this cafe." };
  return null;
}

export async function createCategoryAction(
  _prev: MenuActionState,
  formData: FormData,
): Promise<MenuActionState> {
  const parsed = createCategorySchema.safeParse({
    cafeId: formData.get("cafeId"),
    name: formData.get("name"),
    description: formData.get("description") ?? "",
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const { cafeId, name, description } = parsed.data;
  await requireCafeAccess(cafeId, { roles: ["owner", "manager"] });

  const supabase = await createClient();
  const { data: maxRow } = await supabase
    .from("menu_categories")
    .select("display_order")
    .eq("cafe_id", cafeId)
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("menu_categories").insert({
    cafe_id: cafeId,
    name,
    description,
    display_order: (maxRow?.display_order ?? -1) + 1,
  });

  if (error) return { error: mapMenuError(error) };
  revalidateMenu(cafeId);
  return { success: `Category “${name}” created.` };
}

export async function updateCategoryAction(
  _prev: MenuActionState,
  formData: FormData,
): Promise<MenuActionState> {
  const parsed = updateCategorySchema.safeParse({
    id: formData.get("id"),
    cafeId: formData.get("cafeId"),
    name: formData.get("name"),
    description: formData.get("description") ?? "",
    isActive: formData.get("isActive") ?? "true",
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const { id, cafeId, name, description, isActive } = parsed.data;
  await requireCafeAccess(cafeId, { roles: ["owner", "manager"] });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("menu_categories")
    .update({ name, description, is_active: isActive })
    .eq("id", id)
    .eq("cafe_id", cafeId)
    .select("id")
    .maybeSingle();

  if (error) return { error: mapMenuError(error) };
  if (!data) return { error: "Category not found or you do not have permission." };
  revalidateMenu(cafeId);
  return { success: `Category “${name}” updated.` };
}

export async function setCategoryActiveAction(
  _prev: MenuActionState,
  formData: FormData,
): Promise<MenuActionState> {
  const parsed = setCategoryActiveSchema.safeParse({
    id: formData.get("id"),
    cafeId: formData.get("cafeId"),
    isActive: formData.get("isActive"),
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const { id, cafeId, isActive } = parsed.data;
  await requireCafeAccess(cafeId, { roles: ["owner", "manager"] });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("menu_categories")
    .update({ is_active: isActive })
    .eq("id", id)
    .eq("cafe_id", cafeId)
    .select("id, name")
    .maybeSingle();

  if (error) return { error: mapMenuError(error) };
  if (!data) return { error: "Category not found or you do not have permission." };
  revalidateMenu(cafeId);
  return {
    success: isActive
      ? `Category “${data.name}” activated.`
      : `Category “${data.name}” deactivated.`,
  };
}

export async function reorderCategoryAction(
  _prev: MenuActionState,
  formData: FormData,
): Promise<MenuActionState> {
  const parsed = reorderCategorySchema.safeParse({
    cafeId: formData.get("cafeId"),
    id: formData.get("id"),
    direction: formData.get("direction"),
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const { cafeId, id, direction } = parsed.data;
  await requireCafeAccess(cafeId, { roles: ["owner", "manager"] });

  const supabase = await createClient();
  const { data: categories, error } = await supabase
    .from("menu_categories")
    .select("id, display_order")
    .eq("cafe_id", cafeId)
    .order("display_order", { ascending: true });

  if (error) return { error: mapMenuError(error) };
  const list = categories ?? [];
  const index = list.findIndex((row) => row.id === id);
  if (index < 0) return { error: "Category not found." };

  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= list.length) {
    return { success: "Already at the edge." };
  }

  const current = list[index]!;
  const neighbor = list[swapIndex]!;
  const { error: e1 } = await supabase
    .from("menu_categories")
    .update({ display_order: neighbor.display_order })
    .eq("id", current.id)
    .eq("cafe_id", cafeId);
  if (e1) return { error: mapMenuError(e1) };

  const { error: e2 } = await supabase
    .from("menu_categories")
    .update({ display_order: current.display_order })
    .eq("id", neighbor.id)
    .eq("cafe_id", cafeId);
  if (e2) return { error: mapMenuError(e2) };

  revalidateMenu(cafeId);
  return { success: "Category order updated." };
}

export async function deleteCategoryAction(
  _prev: MenuActionState,
  formData: FormData,
): Promise<MenuActionState> {
  const parsed = deleteCategorySchema.safeParse({
    id: formData.get("id"),
    cafeId: formData.get("cafeId"),
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const { id, cafeId } = parsed.data;
  await requireCafeAccess(cafeId, { roles: ["owner", "manager"] });

  const supabase = await createClient();
  const { count } = await supabase
    .from("menu_items")
    .select("id", { count: "exact", head: true })
    .eq("cafe_id", cafeId)
    .eq("category_id", id);

  if ((count ?? 0) > 0) {
    return {
      error:
        "This category still has menu items. Move or delete items first, or deactivate the category.",
    };
  }

  const { data, error } = await supabase
    .from("menu_categories")
    .delete()
    .eq("id", id)
    .eq("cafe_id", cafeId)
    .select("id, name")
    .maybeSingle();

  if (error) return { error: mapMenuError(error) };
  if (!data) return { error: "Category not found or you do not have permission." };
  revalidateMenu(cafeId);
  return { success: `Category “${data.name}” deleted.` };
}

export async function createItemAction(
  _prev: MenuActionState,
  formData: FormData,
): Promise<MenuActionState> {
  const parsed = createItemSchema.safeParse({
    cafeId: formData.get("cafeId"),
    categoryId: formData.get("categoryId"),
    name: formData.get("name"),
    description: formData.get("description") ?? "",
    price: formData.get("price"),
    diet: formData.get("diet"),
    isAvailable: formData.get("isAvailable") ?? "true",
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const { cafeId, categoryId, name, description, price, diet, isAvailable } = parsed.data;
  const { role } = await requireCafeAccess(cafeId, { roles: ["owner", "manager"] });
  if (!canManageMenu(role)) {
    return { error: "You do not have permission to manage the menu." };
  }

  const categoryError = await assertCategoryBelongsToCafe(cafeId, categoryId);
  if (categoryError) return categoryError;

  const supabase = await createClient();
  const { data: maxRow } = await supabase
    .from("menu_items")
    .select("display_order")
    .eq("cafe_id", cafeId)
    .eq("category_id", categoryId)
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("menu_items").insert({
    cafe_id: cafeId,
    category_id: categoryId,
    name,
    description,
    price,
    diet,
    is_available: isAvailable,
    display_order: (maxRow?.display_order ?? -1) + 1,
  });

  if (error) return { error: mapMenuError(error) };
  revalidateMenu(cafeId);
  return { success: `“${name}” added to your menu.` };
}

export async function updateItemAction(
  _prev: MenuActionState,
  formData: FormData,
): Promise<MenuActionState> {
  const parsed = updateItemSchema.safeParse({
    id: formData.get("id"),
    cafeId: formData.get("cafeId"),
    categoryId: formData.get("categoryId"),
    name: formData.get("name"),
    description: formData.get("description") ?? "",
    price: formData.get("price"),
    diet: formData.get("diet"),
    isAvailable: formData.get("isAvailable"),
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const { id, cafeId, categoryId, name, description, price, diet, isAvailable } =
    parsed.data;
  await requireCafeAccess(cafeId, { roles: ["owner", "manager"] });

  const categoryError = await assertCategoryBelongsToCafe(cafeId, categoryId);
  if (categoryError) return categoryError;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("menu_items")
    .update({
      category_id: categoryId,
      name,
      description,
      price,
      diet,
      is_available: isAvailable,
    })
    .eq("id", id)
    .eq("cafe_id", cafeId)
    .select("id")
    .maybeSingle();

  if (error) return { error: mapMenuError(error) };
  if (!data) return { error: "Item not found or you do not have permission." };
  revalidateMenu(cafeId);
  return { success: `Item “${name}” updated.` };
}

export async function setItemAvailabilityAction(
  _prev: MenuActionState,
  formData: FormData,
): Promise<MenuActionState> {
  const parsed = setItemAvailabilitySchema.safeParse({
    id: formData.get("id"),
    cafeId: formData.get("cafeId"),
    isAvailable: formData.get("isAvailable"),
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const { id, cafeId, isAvailable } = parsed.data;
  await requireCafeAccess(cafeId, { roles: ["owner", "manager"] });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("menu_items")
    .update({ is_available: isAvailable })
    .eq("id", id)
    .eq("cafe_id", cafeId)
    .select("id, name")
    .maybeSingle();

  if (error) return { error: mapMenuError(error) };
  if (!data) return { error: "Item not found or you do not have permission." };
  revalidateMenu(cafeId);
  return {
    success: isAvailable
      ? `“${data.name}” is now available.`
      : `“${data.name}” is now unavailable.`,
  };
}

export async function reorderItemAction(
  _prev: MenuActionState,
  formData: FormData,
): Promise<MenuActionState> {
  const parsed = reorderItemSchema.safeParse({
    cafeId: formData.get("cafeId"),
    id: formData.get("id"),
    direction: formData.get("direction"),
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const { cafeId, id, direction } = parsed.data;
  await requireCafeAccess(cafeId, { roles: ["owner", "manager"] });

  const supabase = await createClient();
  const { data: current, error: currentError } = await supabase
    .from("menu_items")
    .select("id, category_id, display_order")
    .eq("id", id)
    .eq("cafe_id", cafeId)
    .maybeSingle();

  if (currentError) return { error: mapMenuError(currentError) };
  if (!current) return { error: "Item not found." };

  const { data: siblings, error } = await supabase
    .from("menu_items")
    .select("id, display_order")
    .eq("cafe_id", cafeId)
    .eq("category_id", current.category_id)
    .order("display_order", { ascending: true });

  if (error) return { error: mapMenuError(error) };
  const list = siblings ?? [];
  const index = list.findIndex((row) => row.id === id);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || swapIndex < 0 || swapIndex >= list.length) {
    return { success: "Already at the edge." };
  }

  const neighbor = list[swapIndex]!;
  const { error: e1 } = await supabase
    .from("menu_items")
    .update({ display_order: neighbor.display_order })
    .eq("id", current.id)
    .eq("cafe_id", cafeId);
  if (e1) return { error: mapMenuError(e1) };

  const { error: e2 } = await supabase
    .from("menu_items")
    .update({ display_order: current.display_order })
    .eq("id", neighbor.id)
    .eq("cafe_id", cafeId);
  if (e2) return { error: mapMenuError(e2) };

  revalidateMenu(cafeId);
  return { success: "Item order updated." };
}

export async function deleteItemAction(
  _prev: MenuActionState,
  formData: FormData,
): Promise<MenuActionState> {
  const parsed = deleteItemSchema.safeParse({
    id: formData.get("id"),
    cafeId: formData.get("cafeId"),
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const { id, cafeId } = parsed.data;
  await requireCafeAccess(cafeId, { roles: ["owner", "manager"] });

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("menu_items")
    .select("id, name, image_path")
    .eq("id", id)
    .eq("cafe_id", cafeId)
    .maybeSingle();

  if (!existing) return { error: "Item not found or you do not have permission." };

  if (existing.image_path) {
    await supabase.storage.from(CAFE_ASSETS_BUCKET).remove([existing.image_path]);
  }

  const { error } = await supabase
    .from("menu_items")
    .delete()
    .eq("id", id)
    .eq("cafe_id", cafeId);

  if (error) return { error: mapMenuError(error) };
  revalidateMenu(cafeId);
  return {
    success: `Item “${existing.name}” deleted. Prefer marking unavailable when orders may reference it later.`,
  };
}

export async function uploadItemImageAction(
  _prev: MenuActionState,
  formData: FormData,
): Promise<MenuActionState> {
  const parsed = uploadItemImageSchema.safeParse({
    cafeId: formData.get("cafeId"),
    itemId: formData.get("itemId"),
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const { cafeId, itemId } = parsed.data;
  await requireCafeAccess(cafeId, { roles: ["owner", "manager"] });

  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose an image to upload." };
  }

  if (file.size > MENU_IMAGE_MAX_BYTES) {
    return { error: "Image must be 2 MB or smaller." };
  }

  if (!isAllowedMenuImageMime(file.type)) {
    return { error: "Use a PNG, JPEG, or WebP image." };
  }

  const buffer = new Uint8Array(await file.arrayBuffer());
  const detected =
    buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47
      ? "image/png"
      : buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff
        ? "image/jpeg"
        : buffer[0] === 0x52 &&
            buffer[1] === 0x49 &&
            buffer[2] === 0x46 &&
            buffer[3] === 0x46 &&
            buffer[8] === 0x57 &&
            buffer[9] === 0x45 &&
            buffer[10] === 0x42 &&
            buffer[11] === 0x50
          ? "image/webp"
          : null;

  if (!detected || detected !== file.type) {
    return { error: "Use a PNG, JPEG, or WebP image." };
  }

  const supabase = await createClient();
  const { data: item, error: itemError } = await supabase
    .from("menu_items")
    .select("id, image_path")
    .eq("id", itemId)
    .eq("cafe_id", cafeId)
    .maybeSingle();

  if (itemError) return { error: mapMenuError(itemError) };
  if (!item) return { error: "Item not found or you do not have permission." };

  const objectPath = menuItemImageObjectPath(cafeId, itemId, randomUUID(), detected);
  const uploadBuffer = Buffer.from(buffer);

  const { error: uploadError } = await supabase.storage
    .from(CAFE_ASSETS_BUCKET)
    .upload(objectPath, uploadBuffer, {
      contentType: detected,
      upsert: false,
    });

  if (uploadError) {
    return { error: uploadError.message || "Unable to upload image." };
  }

  const { error: updateError } = await supabase
    .from("menu_items")
    .update({ image_path: objectPath })
    .eq("id", itemId)
    .eq("cafe_id", cafeId);

  if (updateError) {
    await supabase.storage.from(CAFE_ASSETS_BUCKET).remove([objectPath]);
    return { error: mapMenuError(updateError) };
  }

  if (item.image_path && item.image_path !== objectPath) {
    await supabase.storage.from(CAFE_ASSETS_BUCKET).remove([item.image_path]);
  }

  revalidateMenu(cafeId);
  return { success: "Image updated." };
}

export async function removeItemImageAction(
  _prev: MenuActionState,
  formData: FormData,
): Promise<MenuActionState> {
  const parsed = removeItemImageSchema.safeParse({
    cafeId: formData.get("cafeId"),
    itemId: formData.get("itemId"),
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const { cafeId, itemId } = parsed.data;
  await requireCafeAccess(cafeId, { roles: ["owner", "manager"] });

  const supabase = await createClient();
  const { data: item, error: itemError } = await supabase
    .from("menu_items")
    .select("id, image_path")
    .eq("id", itemId)
    .eq("cafe_id", cafeId)
    .maybeSingle();

  if (itemError) return { error: mapMenuError(itemError) };
  if (!item) return { error: "Item not found or you do not have permission." };

  if (item.image_path) {
    await supabase.storage.from(CAFE_ASSETS_BUCKET).remove([item.image_path]);
  }

  const { error } = await supabase
    .from("menu_items")
    .update({ image_path: null })
    .eq("id", itemId)
    .eq("cafe_id", cafeId);

  if (error) return { error: mapMenuError(error) };
  revalidateMenu(cafeId);
  return { success: "Image removed." };
}
