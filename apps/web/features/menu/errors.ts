export function mapMenuError(error: { message?: string; code?: string } | null): string {
  if (!error) {
    return "Something went wrong. Please try again.";
  }

  const message = (error.message ?? "").toLowerCase();
  const code = (error.code ?? "").toLowerCase();

  if (
    message.includes("menu_categories_cafe_name_unique") ||
    (code === "23505" && message.includes("menu_categories"))
  ) {
    return "A category with that name already exists in this cafe.";
  }

  if (
    message.includes("menu_items_cafe_category_name_unique") ||
    (code === "23505" && message.includes("menu_items"))
  ) {
    return "An item with that name already exists in this category.";
  }

  if (message.includes("category must belong to the same cafe")) {
    return "That category does not belong to this cafe.";
  }

  if (code === "23503" || message.includes("foreign key")) {
    return "Cannot delete this category while it still has menu items. Move or delete items first, or deactivate the category.";
  }

  if (code === "23514" || message.includes("price")) {
    return "Price must be greater than 0.";
  }

  if (code === "42501" || message.includes("row-level security")) {
    return "You do not have permission to manage the menu.";
  }

  if (message.includes("network") || message.includes("fetch")) {
    return "Network error. Check your connection and try again.";
  }

  return "Unable to save menu changes. Please try again.";
}
