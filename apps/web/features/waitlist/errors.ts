export function mapWaitlistError(
  error: {
    message?: string;
    code?: string;
  } | null,
): string {
  if (!error) {
    return "Something went wrong. Please try again.";
  }

  const message = (error.message ?? "").toLowerCase();
  const code = (error.code ?? "").toLowerCase();

  if (code === "23505" || message.includes("duplicate") || message.includes("unique")) {
    return "You're already on the list. We'll be in touch soon.";
  }

  return "Something went wrong. Please try again.";
}
