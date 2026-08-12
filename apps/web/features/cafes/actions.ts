"use server";

import { redirect } from "next/navigation";

import { setActiveCafeId } from "@/features/memberships/active-cafe";
import { requireCafeAccess } from "@/features/memberships/access";
import { mapCafeError } from "@/features/cafes/errors";
import {
  createCafeSchema,
  parseOpeningHoursFromForm,
  updateCafeBusinessSchema,
  updateCafeHoursSchema,
  updateCafeProfileSchema,
  updateCafeSchema,
} from "@/features/cafes/schemas";
import {
  CAFE_SELECT_COLUMNS,
  DEFAULT_OPENING_HOURS,
  type Cafe,
  type CafeStatus,
  type OpeningHours,
  type Weekday,
  WEEKDAYS,
} from "@/features/cafes/types";
import { createClient } from "@/lib/supabase/server";

export type CafeActionState = {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string[]>;
};

async function requireUserId(): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims?.sub || typeof data.claims.sub !== "string") {
    redirect("/login");
  }

  return data.claims.sub;
}

function normalizeOpeningHours(raw: unknown): OpeningHours {
  if (!raw || typeof raw !== "object") {
    return DEFAULT_OPENING_HOURS;
  }
  const source = raw as Record<string, unknown>;
  const result = { ...DEFAULT_OPENING_HOURS };
  for (const day of WEEKDAYS) {
    const value = source[day];
    if (!value || typeof value !== "object") continue;
    const row = value as Record<string, unknown>;
    result[day as Weekday] = {
      closed: Boolean(row.closed),
      open: typeof row.open === "string" ? row.open : null,
      close: typeof row.close === "string" ? row.close : null,
    };
  }
  return result;
}

function mapCafeRow(row: Record<string, unknown>): Cafe {
  return {
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    owner_id: String(row.owner_id),
    description: (row.description as string | null) ?? null,
    logo_url: (row.logo_url as string | null) ?? null,
    cover_image_url: (row.cover_image_url as string | null) ?? null,
    phone: (row.phone as string | null) ?? null,
    email: (row.email as string | null) ?? null,
    website: (row.website as string | null) ?? null,
    address_line1: (row.address_line1 as string | null) ?? null,
    address_line2: (row.address_line2 as string | null) ?? null,
    city: (row.city as string | null) ?? null,
    state: (row.state as string | null) ?? null,
    country: (row.country as string | null) ?? null,
    postal_code: (row.postal_code as string | null) ?? null,
    timezone: String(row.timezone ?? "Asia/Kolkata"),
    currency: String(row.currency ?? "INR"),
    status: (row.status as CafeStatus) ?? "active",
    opening_hours: normalizeOpeningHours(row.opening_hours),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export async function getOwnedCafes(): Promise<Cafe[]> {
  const supabase = await createClient();
  await requireUserId();

  const { data, error } = await supabase
    .from("cafes")
    .select(CAFE_SELECT_COLUMNS)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(mapCafeError(error));
  }

  return (data ?? []).map((row) => mapCafeRow(row as Record<string, unknown>));
}

export async function getOwnedCafeById(id: string): Promise<Cafe | null> {
  return getCafeById(id);
}

/** Load a cafe the current user can access (any membership via RLS). */
export async function getCafeById(id: string): Promise<Cafe | null> {
  const supabase = await createClient();
  await requireUserId();

  const { data, error } = await supabase
    .from("cafes")
    .select(CAFE_SELECT_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(mapCafeError(error));
  }

  if (!data) return null;
  return mapCafeRow(data as Record<string, unknown>);
}

export async function createCafeAction(
  _prev: CafeActionState,
  formData: FormData,
): Promise<CafeActionState> {
  const parsed = createCafeSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
  });

  if (!parsed.success) {
    return {
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const ownerId = await requireUserId();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("cafes")
    .insert({
      name: parsed.data.name,
      slug: parsed.data.slug,
      owner_id: ownerId,
    })
    .select("id")
    .single();

  if (error) {
    return { error: mapCafeError(error) };
  }

  await setActiveCafeId(data.id);
  redirect(`/dashboard/cafes/${data.id}`);
}

export async function updateCafeAction(
  _prev: CafeActionState,
  formData: FormData,
): Promise<CafeActionState> {
  const parsed = updateCafeSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    slug: formData.get("slug"),
  });

  if (!parsed.success) {
    return {
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  await requireCafeAccess(parsed.data.id, { roles: ["owner", "manager"] });
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("cafes")
    .update({
      name: parsed.data.name,
      slug: parsed.data.slug,
    })
    .eq("id", parsed.data.id)
    .select("id")
    .maybeSingle();

  if (error) {
    return { error: mapCafeError(error) };
  }

  if (!data) {
    return { error: "Cafe not found or you do not have permission to update it." };
  }

  return { success: "Cafe identity saved." };
}

export async function updateCafeProfileAction(
  _prev: CafeActionState,
  formData: FormData,
): Promise<CafeActionState> {
  const parsed = updateCafeProfileSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    description: formData.get("description") ?? "",
    phone: formData.get("phone") ?? "",
    email: formData.get("email") ?? "",
    website: formData.get("website") ?? "",
    address_line1: formData.get("address_line1") ?? "",
    address_line2: formData.get("address_line2") ?? "",
    city: formData.get("city") ?? "",
    state: formData.get("state") ?? "",
    country: formData.get("country") ?? "",
    postal_code: formData.get("postal_code") ?? "",
  });

  if (!parsed.success) {
    return {
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  await requireCafeAccess(parsed.data.id, { roles: ["owner", "manager"] });
  const supabase = await createClient();

  const { id, ...profile } = parsed.data;
  const { data, error } = await supabase
    .from("cafes")
    .update(profile)
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    return { error: mapCafeError(error) };
  }
  if (!data) {
    return { error: "Cafe not found or you do not have permission to update it." };
  }

  return { success: "Profile saved." };
}

export async function updateCafeBusinessAction(
  _prev: CafeActionState,
  formData: FormData,
): Promise<CafeActionState> {
  const parsed = updateCafeBusinessSchema.safeParse({
    id: formData.get("id"),
    timezone: formData.get("timezone"),
    currency: formData.get("currency"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return {
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  await requireCafeAccess(parsed.data.id, { roles: ["owner", "manager"] });
  const supabase = await createClient();

  const { id, ...business } = parsed.data;
  const { data, error } = await supabase
    .from("cafes")
    .update(business)
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    return { error: mapCafeError(error) };
  }
  if (!data) {
    return { error: "Cafe not found or you do not have permission to update it." };
  }

  return { success: "Business settings saved." };
}

export async function updateCafeHoursAction(
  _prev: CafeActionState,
  formData: FormData,
): Promise<CafeActionState> {
  const cafeId = String(formData.get("id") ?? "");
  const parsed = updateCafeHoursSchema.safeParse({
    id: cafeId,
    opening_hours: parseOpeningHoursFromForm(formData),
  });

  if (!parsed.success) {
    return {
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  await requireCafeAccess(parsed.data.id, { roles: ["owner", "manager"] });
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("cafes")
    .update({ opening_hours: parsed.data.opening_hours })
    .eq("id", parsed.data.id)
    .select("id")
    .maybeSingle();

  if (error) {
    return { error: mapCafeError(error) };
  }
  if (!data) {
    return { error: "Cafe not found or you do not have permission to update it." };
  }

  return { success: "Opening hours saved." };
}
