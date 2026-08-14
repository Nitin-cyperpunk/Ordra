import { z } from "zod";

/** Indian mobile first; optional +91. Extensible for international later. */
export const waitlistPhoneSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/[\s\-()]/g, ""))
  .refine(
    (value) => /^(\+91)?[6-9]\d{9}$/.test(value),
    "Enter a valid Indian mobile number (10 digits, optional +91).",
  );

export const waitlistSchema = z.object({
  cafeName: z
    .string()
    .trim()
    .min(2, "Cafe name must be at least 2 characters.")
    .max(120, "Cafe name must be at most 120 characters."),
  ownerName: z
    .string()
    .trim()
    .min(2, "Owner name must be at least 2 characters.")
    .max(100, "Owner name must be at most 100 characters."),
  phone: waitlistPhoneSchema,
  cafeAddress: z
    .string()
    .trim()
    .min(5, "Address must be at least 5 characters.")
    .max(300, "Address must be at most 300 characters."),
  email: z
    .string()
    .trim()
    .email("Enter a valid email address.")
    .max(254, "Email is too long.")
    .transform((value) => value.toLowerCase()),
});

export type WaitlistInput = z.infer<typeof waitlistSchema>;
