export function mapMembershipError(
  error: { message?: string; code?: string } | null,
): string {
  if (!error) {
    return "Something went wrong. Please try again.";
  }

  const message = (error.message ?? "").toLowerCase();
  const code = (error.code ?? "").toLowerCase();

  if (code === "23505" || message.includes("duplicate") || message.includes("unique")) {
    return "That member or invite already exists for this cafe.";
  }

  if (code === "42501" || message.includes("row-level security")) {
    return "You do not have permission to manage this team.";
  }

  if (message.includes("owner_id cannot be changed")) {
    return "Ownership cannot be transferred from this screen.";
  }

  return "Unable to update team. Please try again.";
}
