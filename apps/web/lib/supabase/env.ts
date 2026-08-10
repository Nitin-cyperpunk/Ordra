/**
 * Resolve Supabase public URL + key from env.
 *
 * Prefer publishable keys (`sb_publishable_...`). Local CLI still emits legacy
 * `anon` / `service_role` JWTs — both are supported during the migration window.
 */

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing environment variable: ${name}. Copy .env.example to .env.local and fill Supabase values (run \`pnpm db:status\` after \`pnpm db:start\`).`,
    );
  }
  return value;
}

export function getSupabaseUrl(): string {
  return required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export function getSupabasePublishableKey(): string {
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return required(
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)",
    key,
  );
}

export function getSupabaseSecretKey(): string {
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  return required("SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY)", key);
}
