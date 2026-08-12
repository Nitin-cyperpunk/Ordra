"use server";

import { mapWaitlistError } from "@/features/waitlist/errors";
import { waitlistSchema } from "@/features/waitlist/schemas";
import { createClient } from "@/lib/supabase/server";

export type WaitlistActionState = {
  error?: string;
  success?: boolean;
  fieldErrors?: Record<string, string[]>;
};

export async function joinWaitlistAction(
  _prev: WaitlistActionState,
  formData: FormData,
): Promise<WaitlistActionState> {
  // Honeypot: bots that fill hidden fields get a fake success (no insert).
  const honeypot = String(formData.get("website") ?? "").trim();
  if (honeypot.length > 0) {
    return { success: true };
  }

  const parsed = waitlistSchema.safeParse({
    cafeName: formData.get("cafeName"),
    ownerName: formData.get("ownerName"),
    phone: formData.get("phone"),
    cafeAddress: formData.get("cafeAddress"),
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return {
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("waitlist").insert({
    cafe_name: parsed.data.cafeName,
    owner_name: parsed.data.ownerName,
    phone: parsed.data.phone,
    email: parsed.data.email,
    cafe_address: parsed.data.cafeAddress,
    status: "pending",
  });

  if (error) {
    console.error("[waitlist] insert failed", error.code);
    return { error: mapWaitlistError(error) };
  }

  return { success: true };
}
