/** Public cafe / table column contracts (safe to import from tests). */

/** Must match public.public_cafes view columns exactly. */
export const PUBLIC_CAFE_COLUMNS =
  "id, name, slug, description, logo_url, currency, city, status" as const;

/** Must match public.public_cafe_tables view columns used publicly. */
export const PUBLIC_TABLE_COLUMNS = "cafe_id, code, public_token, status" as const;

/** Fields that must never appear on the public cafe contract. */
export const PRIVATE_CAFE_FIELDS = [
  "owner_id",
  "email",
  "phone",
  "website",
  "address_line1",
  "address_line2",
  "state",
  "country",
  "postal_code",
  "timezone",
  "opening_hours",
  "cover_image_url",
  "created_at",
  "updated_at",
] as const;

/** Fields that must never appear on public table context. */
export const PRIVATE_TABLE_FIELDS = [
  "id",
  "section_id",
  "capacity",
  "sort_order",
  "created_at",
  "updated_at",
] as const;
