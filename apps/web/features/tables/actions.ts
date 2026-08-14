"use server";

import { revalidatePath } from "next/cache";

import { requireCafeAccess } from "@/features/memberships/access";
import { mapTableError } from "@/features/tables/errors";
import {
  bulkCreateTablesSchema,
  createSectionSchema,
  createTableSchema,
  deleteSectionSchema,
  deleteTableSchema,
  formatBulkTableCode,
  setTableStatusSchema,
  updateSectionSchema,
  updateTableSchema,
} from "@/features/tables/schemas";
import {
  CAFE_TABLE_SECTION_SELECT_COLUMNS,
  CAFE_TABLE_SELECT_COLUMNS,
  canManageTables,
  type CafeTable,
  type CafeTableSection,
  type CafeTableStatus,
} from "@/features/tables/types";
import { createClient } from "@/lib/supabase/server";

export type TableActionState = {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string[]>;
};

function revalidateTables(cafeId: string) {
  revalidatePath(`/dashboard/cafes/${cafeId}/tables`);
  revalidatePath(`/dashboard/cafes/${cafeId}`);
}

function mapSectionRow(row: Record<string, unknown>): CafeTableSection {
  return {
    id: String(row.id),
    cafe_id: String(row.cafe_id),
    name: String(row.name),
    sort_order: Number(row.sort_order ?? 0),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

function mapTableRow(row: Record<string, unknown>): CafeTable {
  const sectionRaw = row.cafe_table_sections;
  let section: CafeTableSection | null = null;
  if (sectionRaw && typeof sectionRaw === "object" && !Array.isArray(sectionRaw)) {
    section = mapSectionRow(sectionRaw as Record<string, unknown>);
  }

  return {
    id: String(row.id),
    cafe_id: String(row.cafe_id),
    code: String(row.code),
    capacity: Number(row.capacity),
    status: row.status as CafeTableStatus,
    section_id: (row.section_id as string | null) ?? null,
    public_token: String(row.public_token),
    sort_order: Number(row.sort_order ?? 0),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    section,
  };
}

export type ListTablesOptions = {
  status?: CafeTableStatus | "all";
  sectionId?: string | "all" | "none";
  q?: string;
};

export async function listCafeTables(
  cafeId: string,
  options: ListTablesOptions = {},
): Promise<CafeTable[]> {
  await requireCafeAccess(cafeId);
  const supabase = await createClient();

  let query = supabase
    .from("cafe_tables")
    .select(
      `${CAFE_TABLE_SELECT_COLUMNS}, cafe_table_sections ( ${CAFE_TABLE_SECTION_SELECT_COLUMNS} )`,
    )
    .eq("cafe_id", cafeId)
    .order("sort_order", { ascending: true })
    .order("code", { ascending: true });

  if (options.status && options.status !== "all") {
    query = query.eq("status", options.status);
  }

  if (options.sectionId === "none") {
    query = query.is("section_id", null);
  } else if (options.sectionId && options.sectionId !== "all") {
    query = query.eq("section_id", options.sectionId);
  }

  if (options.q?.trim()) {
    query = query.ilike("code", `%${options.q.trim()}%`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(mapTableError(error));
  }

  return (data ?? []).map((row) => mapTableRow(row as Record<string, unknown>));
}

export async function listCafeTableSections(cafeId: string): Promise<CafeTableSection[]> {
  await requireCafeAccess(cafeId);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("cafe_table_sections")
    .select(CAFE_TABLE_SECTION_SELECT_COLUMNS)
    .eq("cafe_id", cafeId)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    throw new Error(mapTableError(error));
  }

  return (data ?? []).map((row) => mapSectionRow(row as Record<string, unknown>));
}

async function assertSectionBelongsToCafe(
  cafeId: string,
  sectionId: string | null | undefined,
): Promise<TableActionState | null> {
  if (!sectionId) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cafe_table_sections")
    .select("id")
    .eq("id", sectionId)
    .eq("cafe_id", cafeId)
    .maybeSingle();

  if (error) {
    return { error: mapTableError(error) };
  }

  if (!data) {
    return { error: "That section does not belong to this cafe." };
  }

  return null;
}

export async function createTableAction(
  _prev: TableActionState,
  formData: FormData,
): Promise<TableActionState> {
  const parsed = createTableSchema.safeParse({
    cafeId: formData.get("cafeId"),
    code: formData.get("code"),
    capacity: formData.get("capacity"),
    sectionId: formData.get("sectionId") ?? "",
    status: formData.get("status") || "active",
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { cafeId, code, capacity, sectionId, status } = parsed.data;
  const { role } = await requireCafeAccess(cafeId, { roles: ["owner", "manager"] });
  if (!canManageTables(role)) {
    return { error: "You do not have permission to manage tables." };
  }

  const sectionError = await assertSectionBelongsToCafe(cafeId, sectionId);
  if (sectionError) return sectionError;

  const supabase = await createClient();
  const { error } = await supabase.from("cafe_tables").insert({
    cafe_id: cafeId,
    code,
    capacity,
    section_id: sectionId,
    status,
  });

  if (error) {
    return { error: mapTableError(error) };
  }

  revalidateTables(cafeId);
  return { success: `Table ${code} created.` };
}

export async function updateTableAction(
  _prev: TableActionState,
  formData: FormData,
): Promise<TableActionState> {
  const parsed = updateTableSchema.safeParse({
    id: formData.get("id"),
    cafeId: formData.get("cafeId"),
    code: formData.get("code"),
    capacity: formData.get("capacity"),
    sectionId: formData.get("sectionId") ?? "",
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { id, cafeId, code, capacity, sectionId, status } = parsed.data;
  await requireCafeAccess(cafeId, { roles: ["owner", "manager"] });

  const sectionError = await assertSectionBelongsToCafe(cafeId, sectionId);
  if (sectionError) return sectionError;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cafe_tables")
    .update({
      code,
      capacity,
      section_id: sectionId,
      status,
    })
    .eq("id", id)
    .eq("cafe_id", cafeId)
    .select("id")
    .maybeSingle();

  if (error) {
    return { error: mapTableError(error) };
  }

  if (!data) {
    return { error: "Table not found or you do not have permission." };
  }

  revalidateTables(cafeId);
  return { success: `Table ${code} updated.` };
}

export async function setTableStatusAction(
  _prev: TableActionState,
  formData: FormData,
): Promise<TableActionState> {
  const parsed = setTableStatusSchema.safeParse({
    id: formData.get("id"),
    cafeId: formData.get("cafeId"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { id, cafeId, status } = parsed.data;
  await requireCafeAccess(cafeId, { roles: ["owner", "manager"] });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cafe_tables")
    .update({ status })
    .eq("id", id)
    .eq("cafe_id", cafeId)
    .select("id, code")
    .maybeSingle();

  if (error) {
    return { error: mapTableError(error) };
  }

  if (!data) {
    return { error: "Table not found or you do not have permission." };
  }

  revalidateTables(cafeId);
  return {
    success:
      status === "active"
        ? `Table ${data.code} activated.`
        : `Table ${data.code} deactivated.`,
  };
}

export async function deleteTableAction(
  _prev: TableActionState,
  formData: FormData,
): Promise<TableActionState> {
  const parsed = deleteTableSchema.safeParse({
    id: formData.get("id"),
    cafeId: formData.get("cafeId"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { id, cafeId } = parsed.data;
  await requireCafeAccess(cafeId, { roles: ["owner", "manager"] });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cafe_tables")
    .delete()
    .eq("id", id)
    .eq("cafe_id", cafeId)
    .select("id, code")
    .maybeSingle();

  if (error) {
    return { error: mapTableError(error) };
  }

  if (!data) {
    return { error: "Table not found or you do not have permission." };
  }

  revalidateTables(cafeId);
  return { success: `Table ${data.code} deleted.` };
}

export async function bulkCreateTablesAction(
  _prev: TableActionState,
  formData: FormData,
): Promise<TableActionState> {
  const parsed = bulkCreateTablesSchema.safeParse({
    cafeId: formData.get("cafeId"),
    prefix: formData.get("prefix") ?? "T",
    start: formData.get("start"),
    count: formData.get("count"),
    pad: formData.get("pad") || "2",
    capacity: formData.get("capacity"),
    sectionId: formData.get("sectionId") ?? "",
    status: formData.get("status") || "active",
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { cafeId, prefix, start, count, pad, capacity, sectionId, status } = parsed.data;
  await requireCafeAccess(cafeId, { roles: ["owner", "manager"] });

  const sectionError = await assertSectionBelongsToCafe(cafeId, sectionId);
  if (sectionError) return sectionError;

  const rows = Array.from({ length: count }, (_, index) => {
    const n = start + index;
    return {
      cafe_id: cafeId,
      code: formatBulkTableCode(prefix, n, pad),
      capacity,
      section_id: sectionId,
      status,
      sort_order: n,
    };
  });

  const supabase = await createClient();
  const { error } = await supabase.from("cafe_tables").insert(rows);

  if (error) {
    return { error: mapTableError(error) };
  }

  revalidateTables(cafeId);
  return {
    success: `Created ${count} tables (${rows[0]?.code}–${rows[rows.length - 1]?.code}).`,
  };
}

export async function createSectionAction(
  _prev: TableActionState,
  formData: FormData,
): Promise<TableActionState> {
  const parsed = createSectionSchema.safeParse({
    cafeId: formData.get("cafeId"),
    name: formData.get("name"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { cafeId, name } = parsed.data;
  await requireCafeAccess(cafeId, { roles: ["owner", "manager"] });

  const supabase = await createClient();
  const { error } = await supabase.from("cafe_table_sections").insert({
    cafe_id: cafeId,
    name,
  });

  if (error) {
    return { error: mapTableError(error) };
  }

  revalidateTables(cafeId);
  return { success: `Section “${name}” created.` };
}

export async function updateSectionAction(
  _prev: TableActionState,
  formData: FormData,
): Promise<TableActionState> {
  const parsed = updateSectionSchema.safeParse({
    id: formData.get("id"),
    cafeId: formData.get("cafeId"),
    name: formData.get("name"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { id, cafeId, name } = parsed.data;
  await requireCafeAccess(cafeId, { roles: ["owner", "manager"] });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cafe_table_sections")
    .update({ name })
    .eq("id", id)
    .eq("cafe_id", cafeId)
    .select("id")
    .maybeSingle();

  if (error) {
    return { error: mapTableError(error) };
  }

  if (!data) {
    return { error: "Section not found or you do not have permission." };
  }

  revalidateTables(cafeId);
  return { success: `Section updated to “${name}”.` };
}

export async function deleteSectionAction(
  _prev: TableActionState,
  formData: FormData,
): Promise<TableActionState> {
  const parsed = deleteSectionSchema.safeParse({
    id: formData.get("id"),
    cafeId: formData.get("cafeId"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { id, cafeId } = parsed.data;
  await requireCafeAccess(cafeId, { roles: ["owner", "manager"] });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cafe_table_sections")
    .delete()
    .eq("id", id)
    .eq("cafe_id", cafeId)
    .select("id, name")
    .maybeSingle();

  if (error) {
    return { error: mapTableError(error) };
  }

  if (!data) {
    return { error: "Section not found or you do not have permission." };
  }

  revalidateTables(cafeId);
  return { success: `Section “${data.name}” deleted. Tables kept (section cleared).` };
}
