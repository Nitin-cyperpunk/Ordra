/**
 * Database access layer.
 * Prefer feature modules calling Supabase clients from `lib/supabase/*`.
 *
 * Admin client is not re-exported here — import `@/lib/supabase/admin` only
 * from Server Actions / Route Handlers (it uses `server-only`).
 */

export { createClient as createBrowserSupabaseClient } from "@/lib/supabase/client";
export { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
