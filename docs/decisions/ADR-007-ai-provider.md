# ADR-007: AI Provider Abstraction

## Context

Ordra will use AI for advisor, reports, marketing, and chat. Vendors and models change quickly; business logic should not.

## Decision

Define an **`AiProvider` interface** with Vertex AI / Gemini as the primary implementation target. Optional OpenAI/Anthropic adapters later.

## Alternatives

- Call Vertex SDK directly from features
- Use a hosted gateway (e.g., OpenRouter) only
- Delay all abstraction until first feature

## Trade-offs

- **Pros:** Swappable models; testable with fakes; clearer cost/ownership boundaries
- **Cons:** Thin abstraction layer to maintain

## Consequences

- Features depend on `lib/ai`, not vendor SDKs
- SDKs are not installed until the AI module starts
- Env vars reserved for multiple providers

## Learning notes

Ports-and-adapters (hexagonal) architecture is a core senior-engineer skill. Practice it here with AI.
