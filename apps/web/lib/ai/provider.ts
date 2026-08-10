/**
 * AI provider abstraction.
 *
 * Business code should depend on this interface, not on Vertex/OpenAI/Anthropic SDKs.
 * Provider implementations will be added in the AI module.
 */

export type AiMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type AiCompletionRequest = {
  messages: AiMessage[];
  model?: string;
  temperature?: number;
};

export type AiCompletionResponse = {
  content: string;
  provider: string;
  model: string;
};

export interface AiProvider {
  complete(request: AiCompletionRequest): Promise<AiCompletionResponse>;
}

/**
 * Placeholder — throws until a provider is configured.
 */
export function getAiProvider(): AiProvider {
  throw new Error(
    "AI provider is not configured yet. Implement Vertex AI in the AI module.",
  );
}
