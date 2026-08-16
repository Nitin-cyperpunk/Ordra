import type { ExtractedMenuDraft } from "@/features/menu-import/types";

/** Normalized document content after OCR / PDF text extraction. */
export type DocumentContent = {
  text: string;
  mime: string;
  /** True when the processor only has binary bytes and no readable text yet. */
  requiresVision: boolean;
};

export interface DocumentProcessor {
  readonly id: string;
  canProcess(mime: string): boolean;
  process(bytes: Uint8Array, mime: string): Promise<DocumentContent>;
}

export interface MenuExtractor {
  readonly id: string;
  extract(content: DocumentContent): Promise<ExtractedMenuDraft>;
}
