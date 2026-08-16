import type {
  DocumentContent,
  DocumentProcessor,
} from "@/features/menu-import/providers/types";

/**
 * Pass-through for images — text extraction needs a vision provider.
 */
export class ImageDocumentProcessor implements DocumentProcessor {
  readonly id = "image-passthrough";

  canProcess(mime: string): boolean {
    return mime.startsWith("image/");
  }

  async process(bytes: Uint8Array, mime: string): Promise<DocumentContent> {
    void bytes;
    return {
      text: "",
      mime,
      requiresVision: true,
    };
  }
}
