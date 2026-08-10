# AI Architecture

## Goals

Power advisor, reports, forecasting, marketing, and chat without locking Ordra to one vendor.

## Abstraction

Business code depends on `AiProvider` (`apps/web/lib/ai/provider.ts`):

```text
Feature → AiProvider.complete() → Vertex | OpenAI | Anthropic
```

## Primary provider

**Google Vertex AI + Gemini** — aligns with future GCP infrastructure and enterprise data controls.

## Optional providers

- OpenAI
- Anthropic

Add behind the same interface; select via env/config.

## Rules

- Never send secrets or raw payment card data to models
- Prefer tenant-scoped context only
- Log model, latency, and token usage for cost control (later)
- Keep prompts versioned when AI features ship

## What we are NOT doing yet

- Installing Vertex/OpenAI SDKs
- Building RAG pipelines
- Fine-tuning

## What you should learn

- Provider adapters / ports-and-adapters pattern
- Prompt evaluation and cost/performance trade-offs
- Safety boundaries for business data in prompts
