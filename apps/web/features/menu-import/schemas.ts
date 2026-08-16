import { z } from "zod";

import { MENU_ITEM_DIETS } from "@/features/menu/types";

const localId = z.string().min(1).max(80);

export const extractedMenuItemSchema = z.object({
  localId,
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).nullable(),
  price: z.number().positive().max(99999999.99).nullable(),
  diet: z.enum(MENU_ITEM_DIETS).nullable(),
  selected: z.boolean(),
  needsAttention: z.boolean(),
  attentionReason: z.string().trim().max(200).nullable(),
});

export const extractedMenuCategorySchema = z.object({
  localId,
  name: z.string().trim().min(1).max(80),
  items: z.array(extractedMenuItemSchema).max(200),
});

export const extractedMenuDraftSchema = z.object({
  categories: z.array(extractedMenuCategorySchema).max(50),
  warnings: z.array(z.string().max(200)).max(50),
});

export const commitMenuImportSchema = z.object({
  cafeId: z.string().uuid(),
  importId: z.string().uuid(),
  draft: extractedMenuDraftSchema,
});

export type CommitMenuImportInput = z.infer<typeof commitMenuImportSchema>;
