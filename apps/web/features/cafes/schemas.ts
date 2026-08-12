import { z } from "zod";

import { CAFE_STATUSES, WEEKDAYS, type OpeningHours } from "@/features/cafes/types";

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

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null));

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM (24-hour).");

const dayHoursSchema = z
  .object({
    closed: z.boolean(),
    open: z.string().nullable(),
    close: z.string().nullable(),
  })
  .superRefine((day, ctx) => {
    if (day.closed) {
      return;
    }
    if (!day.open || !timeSchema.safeParse(day.open).success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Opening time required (HH:MM).",
        path: ["open"],
      });
    }
    if (!day.close || !timeSchema.safeParse(day.close).success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Closing time required (HH:MM).",
        path: ["close"],
      });
    }
    if (day.open && day.close && day.open >= day.close) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Closing time must be after opening time.",
        path: ["close"],
      });
    }
  });

export const openingHoursSchema = z.object({
  monday: dayHoursSchema,
  tuesday: dayHoursSchema,
  wednesday: dayHoursSchema,
  thursday: dayHoursSchema,
  friday: dayHoursSchema,
  saturday: dayHoursSchema,
  sunday: dayHoursSchema,
}) satisfies z.ZodType<OpeningHours>;

/** Common IANA zones for the select UI; any valid-looking IANA string is accepted. */
export const COMMON_TIMEZONES = [
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Singapore",
  "Europe/London",
  "America/New_York",
  "America/Los_Angeles",
  "UTC",
] as const;

export const updateCafeProfileSchema = z.object({
  id: z.string().uuid("Invalid cafe id."),
  name: z
    .string()
    .trim()
    .min(2, "Cafe name must be at least 2 characters.")
    .max(100, "Cafe name must be at most 100 characters."),
  description: optionalText(2000),
  phone: optionalText(30),
  email: z
    .string()
    .trim()
    .transform((value) => (value.length === 0 ? null : value))
    .pipe(z.union([z.null(), z.string().email("Enter a valid email.")])),
  website: z
    .string()
    .trim()
    .transform((value) => (value.length === 0 ? null : value))
    .pipe(
      z.union([
        z.null(),
        z.string().url("Enter a valid URL (include https://).").max(300),
      ]),
    ),
  address_line1: optionalText(200),
  address_line2: optionalText(200),
  city: optionalText(100),
  state: optionalText(100),
  country: optionalText(100),
  postal_code: optionalText(20),
});

export const updateCafeBusinessSchema = z.object({
  id: z.string().uuid("Invalid cafe id."),
  timezone: z
    .string()
    .trim()
    .min(3)
    .max(64)
    .regex(
      /^[A-Za-z_]+\/[A-Za-z0-9_+\-]+$|^UTC$/,
      "Use an IANA timezone (e.g. Asia/Kolkata).",
    ),
  currency: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/, "Use a 3-letter ISO currency code (e.g. INR)."),
  status: z.enum(CAFE_STATUSES),
});

export const updateCafeHoursSchema = z.object({
  id: z.string().uuid("Invalid cafe id."),
  opening_hours: openingHoursSchema,
});

/** Legacy name/slug update (slug remains editable; URLs use cafe UUID). */
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
export type UpdateCafeProfileInput = z.infer<typeof updateCafeProfileSchema>;
export type UpdateCafeBusinessInput = z.infer<typeof updateCafeBusinessSchema>;
export type UpdateCafeHoursInput = z.infer<typeof updateCafeHoursSchema>;

export function parseOpeningHoursFromForm(formData: FormData): OpeningHours {
  const hours = {} as OpeningHours;
  for (const day of WEEKDAYS) {
    const closed = formData.get(`${day}_closed`) === "on";
    const open = String(formData.get(`${day}_open`) ?? "").trim() || null;
    const close = String(formData.get(`${day}_close`) ?? "").trim() || null;
    hours[day] = {
      closed,
      open: closed ? null : open,
      close: closed ? null : close,
    };
  }
  return hours;
}

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
