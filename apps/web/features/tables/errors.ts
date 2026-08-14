export function mapTableError(error: { message?: string; code?: string } | null): string {
  if (!error) {
    return "Something went wrong. Please try again.";
  }

  const message = (error.message ?? "").toLowerCase();
  const code = (error.code ?? "").toLowerCase();

  if (
    code === "23505" ||
    message.includes("cafe_tables_cafe_code_unique") ||
    (message.includes("duplicate") && message.includes("code"))
  ) {
    return "A table with that number already exists in this cafe.";
  }

  if (
    code === "23505" ||
    message.includes("cafe_table_sections_cafe_name_unique") ||
    (message.includes("duplicate") && message.includes("name"))
  ) {
    return "A section with that name already exists in this cafe.";
  }

  if (message.includes("section must belong to the same cafe")) {
    return "That section does not belong to this cafe.";
  }

  if (code === "23514" || message.includes("capacity")) {
    return "Capacity must be a whole number between 1 and 99.";
  }

  if (code === "42501" || message.includes("row-level security")) {
    return "You do not have permission to manage tables.";
  }

  if (message.includes("network") || message.includes("fetch")) {
    return "Network error. Check your connection and try again.";
  }

  return "Unable to save table. Please try again.";
}
