import { z } from "zod";

import { CAFE_TABLE_STATUSES } from "@/features/tables/types";

const cafeIdSchema = z.string().uuid();

const tableCodeSchema = z
  .string()
  .trim()
  .min(1, "Table number is required.")
  .max(32, "Table number must be at most 32 characters.");

const capacitySchema = z.coerce
  .number({ invalid_type_error: "Capacity must be a number." })
  .int("Capacity must be a whole number.")
  .min(1, "Capacity must be at least 1.")
  .max(99, "Capacity must be at most 99.");

const optionalSectionIdSchema = z
  .union([z.string().uuid("Invalid section."), z.literal(""), z.null()])
  .optional()
  .transform((value) => (value ? value : null));

const statusSchema = z.enum(CAFE_TABLE_STATUSES, {
  errorMap: () => ({ message: "Status must be active or inactive." }),
});

export const createTableSchema = z.object({
  cafeId: cafeIdSchema,
  code: tableCodeSchema,
  capacity: capacitySchema,
  sectionId: optionalSectionIdSchema,
  status: statusSchema.optional().default("active"),
});

export const updateTableSchema = z.object({
  id: z.string().uuid(),
  cafeId: cafeIdSchema,
  code: tableCodeSchema,
  capacity: capacitySchema,
  sectionId: optionalSectionIdSchema,
  status: statusSchema,
});

export const setTableStatusSchema = z.object({
  id: z.string().uuid(),
  cafeId: cafeIdSchema,
  status: statusSchema,
});

export const deleteTableSchema = z.object({
  id: z.string().uuid(),
  cafeId: cafeIdSchema,
});

export const bulkCreateTablesSchema = z.object({
  cafeId: cafeIdSchema,
  prefix: z.string().trim().max(16, "Prefix must be at most 16 characters.").default("T"),
  start: z.coerce
    .number()
    .int()
    .min(1, "Start must be at least 1.")
    .max(999, "Start must be at most 999."),
  count: z.coerce
    .number()
    .int()
    .min(1, "Count must be at least 1.")
    .max(50, "Create at most 50 tables at once."),
  pad: z.coerce.number().int().min(1).max(4).optional().default(2),
  capacity: capacitySchema,
  sectionId: optionalSectionIdSchema,
  status: statusSchema.optional().default("active"),
});

export const createSectionSchema = z.object({
  cafeId: cafeIdSchema,
  name: z
    .string()
    .trim()
    .min(1, "Section name is required.")
    .max(64, "Section name must be at most 64 characters."),
});

export const updateSectionSchema = z.object({
  id: z.string().uuid(),
  cafeId: cafeIdSchema,
  name: z
    .string()
    .trim()
    .min(1, "Section name is required.")
    .max(64, "Section name must be at most 64 characters."),
});

export const deleteSectionSchema = z.object({
  id: z.string().uuid(),
  cafeId: cafeIdSchema,
});

export type CreateTableInput = z.infer<typeof createTableSchema>;
export type UpdateTableInput = z.infer<typeof updateTableSchema>;
export type BulkCreateTablesInput = z.infer<typeof bulkCreateTablesSchema>;

/** Formats bulk codes: prefix T, start 1, pad 2 → T01 */
export function formatBulkTableCode(prefix: string, number: number, pad: number): string {
  return `${prefix}${String(number).padStart(pad, "0")}`;
}
