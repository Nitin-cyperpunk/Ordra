import { randomUUID } from "node:crypto";

import { extractedMenuDraftSchema } from "@/features/menu-import/schemas";
import type { ExtractedMenuDraft } from "@/features/menu-import/types";
import type {
  DocumentContent,
  MenuExtractor,
} from "@/features/menu-import/providers/types";

/**
 * Heuristic structuring from plain text (no LLM).
 * Looks for lines like: "Cappuccino 149" or "Latte - ₹159".
 */
export class HeuristicMenuExtractor implements MenuExtractor {
  readonly id = "heuristic-text-v1";

  async extract(content: DocumentContent): Promise<ExtractedMenuDraft> {
    const lines = content.text
      .split("\n")
      .map((line) => line.replace(/\s+/g, " ").trim())
      .filter(Boolean);

    const categories: ExtractedMenuDraft["categories"] = [];
    let currentName = "Imported";
    let currentItems: ExtractedMenuDraft["categories"][number]["items"] = [];

    const flush = () => {
      if (currentItems.length === 0) return;
      categories.push({
        localId: randomUUID(),
        name: currentName.slice(0, 80),
        items: currentItems,
      });
      currentItems = [];
    };

    const pricePattern =
      /^(.+?)\s+(?:[-–—]\s*)?(?:₹|rs\.?\s*)?(\d{1,7}(?:\.\d{1,2})?)\s*$/i;
    const categoryPattern = /^([A-Za-z][A-Za-z0-9 &/'-]{1,40})$/;

    for (const line of lines) {
      if (line.length > 60) continue;

      const priceMatch = line.match(pricePattern);
      if (priceMatch?.[1] && priceMatch[2]) {
        const name = priceMatch[1].replace(/[·•]+/g, "").trim();
        const price = Number.parseFloat(priceMatch[2]);
        if (name.length >= 2 && Number.isFinite(price) && price > 0) {
          currentItems.push({
            localId: randomUUID(),
            name: name.slice(0, 120),
            description: null,
            price,
            diet: null,
            selected: true,
            needsAttention: false,
            attentionReason: null,
          });
          continue;
        }
      }

      if (
        currentItems.length > 0 &&
        categoryPattern.test(line) &&
        !/\d/.test(line) &&
        line === line.toUpperCase()
      ) {
        flush();
        currentName = line;
        continue;
      }

      if (currentItems.length === 0 && categoryPattern.test(line) && !/\d/.test(line)) {
        currentName = line;
      }
    }

    flush();

    const warnings: string[] = [];
    if (categories.length === 0) {
      warnings.push("We couldn’t confidently find menu items in this file.");
    }

    const draft = extractedMenuDraftSchema.parse({ categories, warnings });
    return draft;
  }
}
