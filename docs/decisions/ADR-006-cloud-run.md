# ADR-006: Future Google Cloud Run Migration

## Context

Long-term infrastructure learning and potential needs (custom networking, workers, GCP AI adjacency) may outgrow Vercel-only hosting.

## Decision

**Prepare** Docker/`standalone` Next.js output and document a **future Cloud Run** path without migrating now.

## Alternatives

- Stay on Vercel indefinitely
- GKE / Kubernetes
- Migrate immediately

## Trade-offs

- **Pros:** Escape hatch ready; aligns with Vertex AI / GCP learning goals
- **Cons:** Maintaining dual paths has mild documentation cost

## Consequences

- `output: "standalone"` in Next config
- Dockerfile exists under `infrastructure/docker/`
- No Kubernetes — unjustified complexity for current scale

## Learning notes

Cloud Run is container-based serverless. Learn containers and twelve-factor apps before orchestrators.
