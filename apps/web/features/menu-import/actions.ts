"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomUUID } from "node:crypto";

import { requireCafeAccess } from "@/features/memberships/access";
import { canManageMenu } from "@/features/menu/types";
import { mapMenuImportError } from "@/features/menu-import/errors";
import { runMenuExtraction } from "@/features/menu-import/providers";
import {
  commitMenuImportSchema,
  extractedMenuDraftSchema,
} from "@/features/menu-import/schemas";
import {
  extensionForMime,
  MENU_IMPORTS_BUCKET,
  menuImportObjectPath,
} from "@/features/menu-import/storage";
import {
  MENU_IMPORT_SELECT,
  type ExtractedMenuDraft,
  type MenuImportRecord,
} from "@/features/menu-import/types";
import { validateMenuImportFile } from "@/features/menu-import/validation";
import { createClient } from "@/lib/supabase/server";

export type MenuImportActionState = {
  error?: string;
  success?: string;
  importId?: string;
};

function mapImportRow(row: Record<string, unknown>): MenuImportRecord {
  const payload = row.extracted_payload;
  let extracted: ExtractedMenuDraft | null = null;
  if (payload && typeof payload === "object") {
    const parsed = extractedMenuDraftSchema.safeParse(payload);
    extracted = parsed.success ? parsed.data : null;
  }

  return {
    id: String(row.id),
    cafe_id: String(row.cafe_id),
    created_by: String(row.created_by),
    source_file_path: String(row.source_file_path),
    source_file_name: String(row.source_file_name),
    source_mime: String(row.source_mime),
    source_file_size: Number(row.source_file_size),
    status: row.status as MenuImportRecord["status"],
    provider: (row.provider as string | null) ?? null,
    extracted_payload: extracted,
    error_code: (row.error_code as string | null) ?? null,
    approved_by: (row.approved_by as string | null) ?? null,
    approved_at: (row.approved_at as string | null) ?? null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    completed_at: (row.completed_at as string | null) ?? null,
  };
}

export async function getMenuImport(
  cafeId: string,
  importId: string,
): Promise<MenuImportRecord | null> {
  await requireCafeAccess(cafeId, { roles: ["owner", "manager"] });
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("menu_imports")
    .select(MENU_IMPORT_SELECT)
    .eq("cafe_id", cafeId)
    .eq("id", importId)
    .maybeSingle();

  if (error || !data) return null;
  return mapImportRow(data as Record<string, unknown>);
}

export async function listRecentMenuImports(cafeId: string): Promise<MenuImportRecord[]> {
  await requireCafeAccess(cafeId, { roles: ["owner", "manager"] });
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("menu_imports")
    .select(MENU_IMPORT_SELECT)
    .eq("cafe_id", cafeId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) throw new Error("Unable to load imports.");
  return (data ?? []).map((row) => mapImportRow(row as Record<string, unknown>));
}

export async function uploadMenuImportAction(
  _prev: MenuImportActionState,
  formData: FormData,
): Promise<MenuImportActionState> {
  const cafeId = String(formData.get("cafeId") ?? "");
  const file = formData.get("file");

  if (!cafeId) return { error: "Cafe is required." };
  if (!(file instanceof File)) {
    return { error: "Choose a menu file to upload." };
  }

  const { role, user } = await requireCafeAccess(cafeId, {
    roles: ["owner", "manager"],
  });
  if (!canManageMenu(role)) {
    return { error: "You don’t have permission to import menus." };
  }

  const buffer = new Uint8Array(await file.arrayBuffer());
  const validated = validateMenuImportFile(file, buffer);
  if (!validated.ok) return { error: validated.error };

  const importId = randomUUID();
  const objectPath = menuImportObjectPath(
    cafeId,
    importId,
    `original.${extensionForMime(validated.mime)}`,
  );

  const supabase = await createClient();

  const { error: insertError } = await supabase.from("menu_imports").insert({
    id: importId,
    cafe_id: cafeId,
    created_by: user.id,
    source_file_path: objectPath,
    source_file_name: file.name.slice(0, 255),
    source_mime: validated.mime,
    source_file_size: buffer.byteLength,
    status: "uploaded",
  });

  if (insertError) {
    return { error: mapMenuImportError(insertError.message) };
  }

  const { error: uploadError } = await supabase.storage
    .from(MENU_IMPORTS_BUCKET)
    .upload(objectPath, buffer, {
      contentType: validated.mime,
      upsert: false,
    });

  if (uploadError) {
    await supabase
      .from("menu_imports")
      .update({ status: "failed", error_code: "UPLOAD" })
      .eq("id", importId);
    return { error: "We couldn’t upload that file. Please try again." };
  }

  // Kick processing immediately (single-pass architecture).
  await processMenuImportInternal(cafeId, importId, buffer, validated.mime);

  redirect(`/dashboard/cafes/${cafeId}/menu/import/${importId}`);
}

async function processMenuImportInternal(
  cafeId: string,
  importId: string,
  bytes: Uint8Array,
  mime: string,
): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from("menu_imports")
    .update({ status: "processing", error_code: null })
    .eq("id", importId)
    .eq("cafe_id", cafeId);

  try {
    const { draft, provider } = await runMenuExtraction({ bytes, mime });
    const itemCount = draft.categories.reduce((sum, cat) => sum + cat.items.length, 0);
    if (itemCount === 0) {
      await supabase
        .from("menu_imports")
        .update({
          status: "failed",
          provider,
          error_code: "MENU_IMPORT_EMPTY",
          extracted_payload: draft,
        })
        .eq("id", importId);
      return;
    }

    await supabase
      .from("menu_imports")
      .update({
        status: "review",
        provider,
        extracted_payload: draft,
        error_code: null,
      })
      .eq("id", importId);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : typeof error === "string" ? error : "";
    const errorCode = message.startsWith("MENU_IMPORT_")
      ? message
      : "MENU_IMPORT_PROVIDER_FAILED";
    await supabase
      .from("menu_imports")
      .update({
        status: "failed",
        error_code: errorCode.slice(0, 80),
      })
      .eq("id", importId);
  }
}

export async function retryMenuImportAction(
  _prev: MenuImportActionState,
  formData: FormData,
): Promise<MenuImportActionState> {
  const cafeId = String(formData.get("cafeId") ?? "");
  const importId = String(formData.get("importId") ?? "");
  if (!cafeId || !importId) return { error: "Invalid import." };

  await requireCafeAccess(cafeId, { roles: ["owner", "manager"] });
  const supabase = await createClient();
  const existing = await getMenuImport(cafeId, importId);
  if (!existing) return { error: "Import not found." };

  const { data: fileData, error } = await supabase.storage
    .from(MENU_IMPORTS_BUCKET)
    .download(existing.source_file_path);

  if (error || !fileData) {
    return { error: "We couldn’t read the original file. Upload again." };
  }

  const bytes = new Uint8Array(await fileData.arrayBuffer());
  await processMenuImportInternal(cafeId, importId, bytes, existing.source_mime);
  redirect(`/dashboard/cafes/${cafeId}/menu/import/${importId}`);
}

export async function commitMenuImportAction(
  _prev: MenuImportActionState,
  formData: FormData,
): Promise<MenuImportActionState> {
  const cafeId = String(formData.get("cafeId") ?? "");
  const importId = String(formData.get("importId") ?? "");
  const draftRaw = String(formData.get("draft") ?? "");

  let draftJson: unknown;
  try {
    draftJson = JSON.parse(draftRaw);
  } catch {
    return { error: "Review data was invalid. Please try again." };
  }

  const parsed = commitMenuImportSchema.safeParse({
    cafeId,
    importId,
    draft: draftJson,
  });
  if (!parsed.success) {
    return { error: "Please fix highlighted items before importing." };
  }

  const { role } = await requireCafeAccess(cafeId, {
    roles: ["owner", "manager"],
  });
  if (!canManageMenu(role)) {
    return { error: "You don’t have permission to import menus." };
  }

  const existing = await getMenuImport(cafeId, importId);
  if (!existing || existing.status !== "review") {
    return { error: mapMenuImportError("MENU_IMPORT_NOT_REVIEW") };
  }

  const selectedCategories = parsed.data.draft.categories
    .map((category) => ({
      ...category,
      items: category.items.filter(
        (item) => item.selected && item.name.trim() && item.price !== null,
      ),
    }))
    .filter((category) => category.items.length > 0);

  if (selectedCategories.length === 0) {
    return { error: "Select at least one item with a valid price to import." };
  }

  const supabase = await createClient();

  const { error: commitError } = await supabase.rpc("commit_menu_import", {
    p_import_id: importId,
    p_cafe_id: cafeId,
    p_draft: {
      ...parsed.data.draft,
      categories: selectedCategories,
    },
  });

  if (commitError) {
    return { error: mapMenuImportError(commitError.message) };
  }

  revalidatePath(`/dashboard/cafes/${cafeId}/menu`);
  redirect(`/dashboard/cafes/${cafeId}/menu`);
}
