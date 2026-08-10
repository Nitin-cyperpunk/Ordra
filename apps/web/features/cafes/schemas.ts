import { z } from "zod";

export const cafeSlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2, "Slug must be at least 2 characters.")
  .max(60, "Slug must be at most 60 characters.")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug may only contain lowercase letters, numbers, and hyphens.",
  );

export const createCafeSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Cafe name must be at least 2 characters.")
    .max(100, "Cafe name must be at most 100 characters."),
  slug: cafeSlugSchema,
});

export const updateCafeSchema = z.object({
  id: z.string().uuid("Invalid cafe id."),
  name: z
    .string()
    .trim()
    .min(2, "Cafe name must be at least 2 characters.")
    .max(100, "Cafe name must be at most 100 characters."),
  slug: cafeSlugSchema,
});

export type CreateCafeInput = z.infer<typeof createCafeSchema>;
export type UpdateCafeInput = z.infer<typeof updateCafeSchema>;

/** Derive a URL-safe slug from a cafe name. */
export function slugifyCafeName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 60);
}
