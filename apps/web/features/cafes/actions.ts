"use server";

import { redirect } from "next/navigation";

import { mapCafeError } from "@/features/cafes/errors";
import { createCafeSchema, updateCafeSchema } from "@/features/cafes/schemas";
import type { Cafe } from "@/features/cafes/types";
import { createClient } from "@/lib/supabase/server";

export type CafeActionState = {
  error?: string;
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

export async function getOwnedCafes(): Promise<Cafe[]> {
  const supabase = await createClient();
  await requireUserId();

  const { data, error } = await supabase
    .from("cafes")
    .select("id, name, slug, owner_id, created_at, updated_at")
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(mapCafeError(error));
  }

  return (data ?? []) as Cafe[];
}

export async function getOwnedCafeById(id: string): Promise<Cafe | null> {
  const supabase = await createClient();
  await requireUserId();

  const { data, error } = await supabase
    .from("cafes")
    .select("id, name, slug, owner_id, created_at, updated_at")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(mapCafeError(error));
  }

  return data as Cafe | null;
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

  await requireUserId();
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

  redirect(`/dashboard/cafes/${parsed.data.id}`);
}
