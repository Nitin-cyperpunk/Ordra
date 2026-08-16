export const MENU_IMPORT_STATUSES = [
  "uploaded",
  "processing",
  "review",
  "completed",
  "failed",
] as const;

export type MenuImportStatus = (typeof MENU_IMPORT_STATUSES)[number];

export const MENU_IMPORT_ALLOWED_MIME = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type MenuImportMime = (typeof MENU_IMPORT_ALLOWED_MIME)[number];

export function getMenuImportMaxBytes(): number {
  const raw = process.env.MENU_IMPORT_MAX_BYTES;
  const parsed = raw ? Number.parseInt(raw, 10) : 10 * 1024 * 1024;
  if (!Number.isFinite(parsed) || parsed < 1024 * 100) {
    return 10 * 1024 * 1024;
  }
  return parsed;
}

export type ExtractedMenuItem = {
  localId: string;
  name: string;
  description: string | null;
  price: number | null;
  diet: "vegetarian" | "non_vegetarian" | null;
  selected: boolean;
  needsAttention: boolean;
  attentionReason: string | null;
};

export type ExtractedMenuCategory = {
  localId: string;
  name: string;
  items: ExtractedMenuItem[];
};

export type ExtractedMenuDraft = {
  categories: ExtractedMenuCategory[];
  warnings: string[];
};

export type MenuImportRecord = {
  id: string;
  cafe_id: string;
  created_by: string;
  source_file_path: string;
  source_file_name: string;
  source_mime: string;
  source_file_size: number;
  status: MenuImportStatus;
  provider: string | null;
  extracted_payload: ExtractedMenuDraft | null;
  error_code: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
};

export const MENU_IMPORT_SELECT =
  "id, cafe_id, created_by, source_file_path, source_file_name, source_mime, source_file_size, status, provider, extracted_payload, error_code, approved_by, approved_at, created_at, updated_at, completed_at" as const;
