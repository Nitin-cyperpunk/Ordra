/**
 * Map Supabase Auth errors to safe, user-facing messages.
 * Never leak internal details.
 */
export function mapAuthError(error: { message?: string; code?: string } | null): string {
  if (!error) {
    return "Something went wrong. Please try again.";
  }

  const message = (error.message ?? "").toLowerCase();
  const code = (error.code ?? "").toLowerCase();

  if (
    code.includes("invalid_credentials") ||
    message.includes("invalid login credentials") ||
    message.includes("invalid credentials")
  ) {
    return "Invalid email or password.";
  }

  if (code.includes("email_not_confirmed") || message.includes("email not confirmed")) {
    return "Please verify your email before signing in. Check your inbox for the confirmation link.";
  }

  if (
    code.includes("user_already_exists") ||
    message.includes("already registered") ||
    message.includes("user already registered")
  ) {
    return "An account with this email already exists. Try signing in instead.";
  }

  if (message.includes("password") && message.includes("weak")) {
    return "Password is too weak. Use at least 8 characters with a letter and a number.";
  }

  if (message.includes("rate limit") || code.includes("over_request_rate")) {
    return "Too many attempts. Please wait a moment and try again.";
  }

  if (message.includes("network") || message.includes("fetch")) {
    return "Network error. Check your connection and try again.";
  }

  return "Unable to complete authentication. Please try again.";
}
