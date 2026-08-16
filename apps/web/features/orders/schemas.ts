import { z } from "zod";

import { ORDER_STATUSES } from "@/features/orders/types";

export const placeOrderSchema = z.object({
  cafeSlug: z.string().trim().min(1).max(80),
  tableToken: z.string().trim().min(8).max(80),
  notes: z
    .string()
    .trim()
    .max(250)
    .optional()
    .transform((value) => (value ? value : undefined)),
  idempotencyKey: z.string().trim().min(8).max(80),
  items: z
    .array(
      z.object({
        menuItemId: z.string().uuid(),
        quantity: z.number().int().min(1).max(99),
      }),
    )
    .min(1)
    .max(50),
});

export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;

export const transitionOrderSchema = z.object({
  cafeId: z.string().uuid(),
  orderId: z.string().uuid(),
  status: z.enum(ORDER_STATUSES),
  note: z
    .string()
    .trim()
    .max(250)
    .optional()
    .transform((value) => (value ? value : undefined)),
});
