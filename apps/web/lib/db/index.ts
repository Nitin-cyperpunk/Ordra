/**
 * Database access layer.
 * Prefer feature modules calling Supabase clients from `lib/supabase/*`.
 */

export { createClient as createBrowserSupabaseClient } from "@/lib/supabase/client";
export { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
export { createAdminClient } from "@/lib/supabase/admin";
