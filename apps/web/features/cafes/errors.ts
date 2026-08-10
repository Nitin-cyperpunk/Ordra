import type { Cafe } from "@/features/cafes/types";

export type { Cafe };

export function mapCafeError(error: { message?: string; code?: string } | null): string {
  if (!error) {
    return "Something went wrong. Please try again.";
  }

  const message = (error.message ?? "").toLowerCase();
  const code = (error.code ?? "").toLowerCase();

  if (code === "23505" || message.includes("duplicate") || message.includes("unique")) {
    return "That cafe slug is already taken. Choose another.";
  }

  if (code === "42501" || message.includes("row-level security")) {
    return "You do not have permission to perform this action.";
  }

  if (message.includes("network") || message.includes("fetch")) {
    return "Network error. Check your connection and try again.";
  }

  return "Unable to save cafe. Please try again.";
}
