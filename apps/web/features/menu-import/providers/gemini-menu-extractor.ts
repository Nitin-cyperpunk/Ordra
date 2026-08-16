import { randomUUID } from "node:crypto";

import { extractedMenuDraftSchema } from "@/features/menu-import/schemas";
import type { ExtractedMenuDraft } from "@/features/menu-import/types";
import type {
  DocumentContent,
  MenuExtractor,
} from "@/features/menu-import/providers/types";

type GeminiPart = { text: string } | { inlineData: { mimeType: string; data: string } };

/**
 * Optional Gemini extractor (Google AI Studio / Generative Language API).
 * Isolated behind MenuExtractor — swap without changing business code.
 */
export class GeminiMenuExtractor implements MenuExtractor {
  readonly id = "gemini-menu-v1";

  constructor(
    private readonly apiKey: string,
    private readonly model: string,
    private readonly imageBytes?: Uint8Array,
    private readonly imageMime?: string,
  ) {}

  async extract(content: DocumentContent): Promise<ExtractedMenuDraft> {
    const parts: GeminiPart[] = [
      {
        text: `Extract a cafe menu as JSON only. Schema:
{"categories":[{"name":"string","items":[{"name":"string","description":string|null,"price":number|null,"diet":"vegetarian"|"non_vegetarian"|null}]}],"warnings":["string"]}
Rules: Do not invent prices or descriptions. Use null when unsure. Prefer short item names. No markdown.`,
      },
    ];

    if (content.text.trim()) {
      parts.push({ text: `Menu text:\n${content.text.slice(0, 20000)}` });
    }

    if (this.imageBytes && this.imageMime && this.imageBytes.byteLength > 0) {
      parts.push({
        inlineData: {
          mimeType: this.imageMime,
          data: Buffer.from(this.imageBytes).toString("base64"),
        },
      });
    }

    if (parts.length < 2) {
      return extractedMenuDraftSchema.parse({
        categories: [],
        warnings: ["No readable menu content was provided."],
      });
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(this.model)}:generateContent?key=${encodeURIComponent(this.apiKey)}`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts }],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!response.ok) {
      throw new Error("MENU_IMPORT_PROVIDER_FAILED");
    }

    const payload = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const rawText =
      payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ??
      "";

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      throw new Error("MENU_IMPORT_PROVIDER_FAILED");
    }

    const root = parsed as {
      categories?: Array<{
        name?: string;
        items?: Array<{
          name?: string;
          description?: string | null;
          price?: number | null;
          diet?: string | null;
        }>;
      }>;
      warnings?: string[];
    };

    const categories =
      root.categories?.map((category) => ({
        localId: randomUUID(),
        name: String(category.name ?? "Imported").slice(0, 80),
        items: (category.items ?? []).map((item) => {
          const price =
            typeof item.price === "number" &&
            Number.isFinite(item.price) &&
            item.price > 0
              ? item.price
              : null;
          return {
            localId: randomUUID(),
            name: String(item.name ?? "Item").slice(0, 120),
            description: item.description
              ? String(item.description).slice(0, 2000)
              : null,
            price,
            diet:
              item.diet === "vegetarian" || item.diet === "non_vegetarian"
                ? item.diet
                : null,
            selected: true,
            needsAttention: price === null,
            attentionReason: price === null ? "Price couldn’t be detected" : null,
          };
        }),
      })) ?? [];

    return extractedMenuDraftSchema.parse({
      categories,
      warnings: Array.isArray(root.warnings)
        ? root.warnings.map((warning) => String(warning).slice(0, 200))
        : [],
    });
  }
}

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
}

export function getGeminiApiKey(): string | null {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || null;
}

export function getGeminiModel(): string {
  return (
    process.env.GEMINI_MENU_MODEL || process.env.VERTEX_AI_MODEL || "gemini-2.0-flash"
  );
}
