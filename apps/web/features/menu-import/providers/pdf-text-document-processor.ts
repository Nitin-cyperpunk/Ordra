import type {
  DocumentContent,
  DocumentProcessor,
} from "@/features/menu-import/providers/types";

/**
 * Local PDF text extraction (no cloud OCR).
 * Uses pdf-parse v2 PDFParse API.
 */
export class PdfTextDocumentProcessor implements DocumentProcessor {
  readonly id = "pdf-text-local";

  canProcess(mime: string): boolean {
    return mime === "application/pdf";
  }

  async process(bytes: Uint8Array, mime: string): Promise<DocumentContent> {
    try {
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: bytes });
      try {
        const result = await parser.getText();
        const text =
          typeof result === "string"
            ? result
            : typeof result === "object" && result && "text" in result
              ? String((result as { text?: unknown }).text ?? "")
              : "";
        const normalized = text.replace(/\r/g, "").trim();
        return {
          text: normalized,
          mime,
          requiresVision: normalized.length < 20,
        };
      } finally {
        await parser.destroy().catch(() => undefined);
      }
    } catch {
      return {
        text: "",
        mime,
        requiresVision: true,
      };
    }
  }
}
