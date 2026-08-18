import { z } from "zod";

export const issueInvoiceSchema = z.object({
  cafeId: z.string().uuid(),
  orderId: z.string().uuid(),
});

export const guestIssueInvoiceSchema = z.object({
  publicToken: z.string().trim().min(8).max(80),
});
