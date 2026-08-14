import { z } from "zod";

import { MENU_ITEM_DIETS } from "@/features/menu/types";

const cafeIdSchema = z.string().uuid();

/**
 * Decimal-safe price string for NUMERIC(10,2).
 * Rejects 0, negatives, and more than 2 decimal places without using float math.
 */
export const menuPriceSchema = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,2})?$/, "Enter a valid price (e.g. 149.50).")
  .superRefine((value, ctx) => {
    const parts = value.split(".");
    const wholePart = parts[0] ?? "0";
    const fractionPart = parts[1] ?? "";
    const whole = Number.parseInt(wholePart, 10);
    const fraction = Number.parseInt(fractionPart.padEnd(2, "0").slice(0, 2) || "0", 10);
    if (!Number.isFinite(whole) || !Number.isFinite(fraction)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Enter a valid price." });
      return;
    }
    if (whole < 0 || fraction < 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Price cannot be negative." });
      return;
    }
    if (whole === 0 && fraction === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Price must be greater than 0.",
      });
      return;
    }
    if (wholePart.length > 8) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Price is too large." });
    }
  });

const optionalDescription = z
  .string()
  .trim()
  .max(2000, "Description must be at most 2000 characters.")
  .optional()
  .transform((value) => (value && value.length > 0 ? value : null));

const categoryDescriptionSchema = z
  .string()
  .trim()
  .max(500, "Description must be at most 500 characters.")
  .optional()
  .transform((value) => (value && value.length > 0 ? value : null));

export const createCategorySchema = z.object({
  cafeId: cafeIdSchema,
  name: z
    .string()
    .trim()
    .min(1, "Category name is required.")
    .max(80, "Category name must be at most 80 characters."),
  description: categoryDescriptionSchema,
});

export const updateCategorySchema = z.object({
  id: z.string().uuid(),
  cafeId: cafeIdSchema,
  name: z
    .string()
    .trim()
    .min(1, "Category name is required.")
    .max(80, "Category name must be at most 80 characters."),
  description: categoryDescriptionSchema,
  isActive: z
    .union([z.literal("true"), z.literal("false"), z.boolean()])
    .transform((value) => value === true || value === "true"),
});

export const setCategoryActiveSchema = z.object({
  id: z.string().uuid(),
  cafeId: cafeIdSchema,
  isActive: z
    .union([z.literal("true"), z.literal("false"), z.boolean()])
    .transform((value) => value === true || value === "true"),
});

export const reorderCategorySchema = z.object({
  cafeId: cafeIdSchema,
  id: z.string().uuid(),
  direction: z.enum(["up", "down"]),
});

export const deleteCategorySchema = z.object({
  id: z.string().uuid(),
  cafeId: cafeIdSchema,
});

export const createItemSchema = z.object({
  cafeId: cafeIdSchema,
  categoryId: z.string().uuid("Choose a category."),
  name: z
    .string()
    .trim()
    .min(1, "Item name is required.")
    .max(120, "Item name must be at most 120 characters."),
  description: optionalDescription,
  price: menuPriceSchema,
  diet: z.enum(MENU_ITEM_DIETS),
  isAvailable: z
    .union([z.literal("true"), z.literal("false"), z.boolean()])
    .optional()
    .transform((value) =>
      value === undefined ? true : value === true || value === "true",
    ),
});

export const updateItemSchema = z.object({
  id: z.string().uuid(),
  cafeId: cafeIdSchema,
  categoryId: z.string().uuid("Choose a category."),
  name: z
    .string()
    .trim()
    .min(1, "Item name is required.")
    .max(120, "Item name must be at most 120 characters."),
  description: optionalDescription,
  price: menuPriceSchema,
  diet: z.enum(MENU_ITEM_DIETS),
  isAvailable: z
    .union([z.literal("true"), z.literal("false"), z.boolean()])
    .transform((value) => value === true || value === "true"),
});

export const setItemAvailabilitySchema = z.object({
  id: z.string().uuid(),
  cafeId: cafeIdSchema,
  isAvailable: z
    .union([z.literal("true"), z.literal("false"), z.boolean()])
    .transform((value) => value === true || value === "true"),
});

export const reorderItemSchema = z.object({
  cafeId: cafeIdSchema,
  id: z.string().uuid(),
  direction: z.enum(["up", "down"]),
});

export const deleteItemSchema = z.object({
  id: z.string().uuid(),
  cafeId: cafeIdSchema,
});

export const uploadItemImageSchema = z.object({
  cafeId: cafeIdSchema,
  itemId: z.string().uuid(),
});

export const removeItemImageSchema = z.object({
  cafeId: cafeIdSchema,
  itemId: z.string().uuid(),
});
