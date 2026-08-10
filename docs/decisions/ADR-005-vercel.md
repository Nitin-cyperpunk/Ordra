# ADR-005: Initial Vercel Deployment

## Context

We need a low-ops hosting path for Next.js while building product modules.

## Decision

Deploy initially to **Vercel**, with Supabase as the data plane.

## Alternatives

- Cloud Run from day one
- Railway / Render
- Self-managed VMs

## Trade-offs

- **Pros:** Best Next.js DX, preview deploys, minimal ops
- **Cons:** Less portable runtime assumptions; cost at scale needs monitoring

## Consequences

- Production workflow remains disabled until ready
- Docker still prepared for future Cloud Run
- Env vars managed in Vercel project settings

## Learning notes

PaaS lets you learn product engineering before platform engineering. That sequencing is intentional.
