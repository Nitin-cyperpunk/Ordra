import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getSupabaseSecretKey, getSupabaseUrl } from "@/lib/supabase/env";

/**
 * Privileged server-only client (bypasses RLS).
 * Never import this into Client Components or expose the secret key.
 */
export function createAdminClient() {
  return createClient(getSupabaseUrl(), getSupabaseSecretKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
