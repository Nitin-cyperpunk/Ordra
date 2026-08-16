export function mapMenuImportError(error: unknown): string {
  const message =
    typeof error === "string"
      ? error
      : error && typeof error === "object" && "message" in error
        ? String((error as { message: unknown }).message)
        : "";

  if (message.includes("MENU_IMPORT_UNSUPPORTED_TYPE")) {
    return "Please upload a PDF, JPG, PNG, or WEBP menu file.";
  }
  if (message.includes("MENU_IMPORT_NEEDS_PROVIDER")) {
    return "We couldn’t read this menu automatically. Try a clearer PDF, or add items manually.";
  }
  if (message.includes("MENU_IMPORT_PROVIDER_FAILED")) {
    return "We couldn’t organize this menu automatically. Please try again.";
  }
  if (message.includes("MENU_IMPORT_EMPTY")) {
    return "We couldn’t find menu items in this file.";
  }
  if (message.includes("MENU_IMPORT_NOT_REVIEW")) {
    return "This import isn’t ready to publish yet.";
  }

  if (message.includes("Not authorized") || message.includes("Not authenticated")) {
    return "You don’t have permission to import menus.";
  }
  if (message.includes("Import is not ready")) {
    return "This import isn’t ready to publish yet.";
  }
  if (message.includes("No items selected")) {
    return "Select at least one item with a valid price to import.";
  }

  return "Something went wrong with this import. Please try again.";
}
