import { HeuristicMenuExtractor } from "@/features/menu-import/providers/heuristic-menu-extractor";
import {
  GeminiMenuExtractor,
  getGeminiApiKey,
  getGeminiModel,
  isGeminiConfigured,
} from "@/features/menu-import/providers/gemini-menu-extractor";
import { ImageDocumentProcessor } from "@/features/menu-import/providers/image-document-processor";
import { PdfTextDocumentProcessor } from "@/features/menu-import/providers/pdf-text-document-processor";
import type {
  DocumentProcessor,
  MenuExtractor,
} from "@/features/menu-import/providers/types";
import type { ExtractedMenuDraft } from "@/features/menu-import/types";

const processors: DocumentProcessor[] = [
  new PdfTextDocumentProcessor(),
  new ImageDocumentProcessor(),
];

export function getDocumentProcessor(mime: string): DocumentProcessor {
  const processor = processors.find((entry) => entry.canProcess(mime));
  if (!processor) {
    throw new Error("MENU_IMPORT_UNSUPPORTED_TYPE");
  }
  return processor;
}

export async function runMenuExtraction(input: {
  bytes: Uint8Array;
  mime: string;
}): Promise<{ draft: ExtractedMenuDraft; provider: string }> {
  const processor = getDocumentProcessor(input.mime);
  const content = await processor.process(input.bytes, input.mime);

  const geminiKey = getGeminiApiKey();
  let extractor: MenuExtractor;
  let provider: string;

  if (isGeminiConfigured() && geminiKey) {
    extractor = new GeminiMenuExtractor(
      geminiKey,
      getGeminiModel(),
      content.requiresVision ? input.bytes : undefined,
      content.requiresVision ? input.mime : undefined,
    );
    provider = extractor.id;
  } else if (content.requiresVision || !content.text.trim()) {
    throw new Error("MENU_IMPORT_NEEDS_PROVIDER");
  } else {
    extractor = new HeuristicMenuExtractor();
    provider = `${processor.id}+${extractor.id}`;
  }

  const draft = await extractor.extract(content);
  return { draft, provider };
}
