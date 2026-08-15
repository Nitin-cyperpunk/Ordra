import {
  MENU_IMPORT_ALLOWED_MIME,
  getMenuImportMaxBytes,
  type MenuImportMime,
} from "@/features/menu-import/types";

const MAGIC: Array<{ mime: MenuImportMime; bytes: number[] }> = [
  { mime: "application/pdf", bytes: [0x25, 0x50, 0x44, 0x46] }, // %PDF
  { mime: "image/png", bytes: [0x89, 0x50, 0x4e, 0x47] },
  { mime: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
  { mime: "image/webp", bytes: [0x52, 0x49, 0x46, 0x46] }, // RIFF....WEBP checked separately
];

function startsWith(buffer: Uint8Array, magic: number[]): boolean {
  if (buffer.length < magic.length) return false;
  return magic.every((byte, index) => buffer[index] === byte);
}

export function detectMenuImportMime(
  buffer: Uint8Array,
  reportedMime: string,
): MenuImportMime | null {
  const reported = reportedMime.toLowerCase().trim();
  if (reported === "image/jpg") {
    // normalize
  }

  if (startsWith(buffer, [0x25, 0x50, 0x44, 0x46])) return "application/pdf";
  if (startsWith(buffer, [0x89, 0x50, 0x4e, 0x47])) return "image/png";
  if (startsWith(buffer, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (
    startsWith(buffer, [0x52, 0x49, 0x46, 0x46]) &&
    buffer.length >= 12 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return "image/webp";
  }

  // Fallback: trust only if reported is allowed AND we found matching magic
  for (const entry of MAGIC) {
    if (
      entry.mime === reported ||
      (reported === "image/jpg" && entry.mime === "image/jpeg")
    ) {
      if (startsWith(buffer, entry.bytes)) return entry.mime;
    }
  }

  return null;
}

export function validateMenuImportFile(
  file: File,
  buffer: Uint8Array,
):
  | {
      ok: true;
      mime: MenuImportMime;
    }
  | {
      ok: false;
      error: string;
    } {
  const max = getMenuImportMaxBytes();
  if (file.size <= 0 || buffer.byteLength <= 0) {
    return { ok: false, error: "That file looks empty. Try another menu file." };
  }
  if (file.size > max || buffer.byteLength > max) {
    return {
      ok: false,
      error: `File is too large. Please upload a menu under ${Math.floor(max / (1024 * 1024))} MB.`,
    };
  }

  const mime = detectMenuImportMime(buffer, file.type || "");
  if (!mime || !MENU_IMPORT_ALLOWED_MIME.includes(mime)) {
    return {
      ok: false,
      error: "Please upload a PDF, JPG, PNG, or WEBP menu file.",
    };
  }

  return { ok: true, mime };
}
