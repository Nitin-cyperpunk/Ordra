/**
 * Auth module surface.
 * Prefer importing from `features/auth/*` for feature code.
 * Supabase clients remain under `lib/supabase/*`.
 */

export { loginAction, logoutAction, signupAction } from "@/features/auth/actions";
export { mapAuthError } from "@/features/auth/errors";
export { loginSchema, signupSchema } from "@/features/auth/schemas";
