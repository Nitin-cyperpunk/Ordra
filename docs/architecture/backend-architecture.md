# Backend Architecture

## Initial approach

Ordra starts with **Next.js as the backend**:

- **Server Actions** for mutations from authenticated UI
- **API Routes** for webhooks, health checks, and external integrations
- **Supabase** for PostgreSQL, Auth, Storage, Realtime

There is no separate Nest/Express/FastAPI service in v1.

## Layering

```text
UI / Route Handler
        ↓
Feature use-case (features/*)
        ↓
Domain validation (Zod / packages/validation)
        ↓
Data access (lib/db + Supabase client)
        ↓
PostgreSQL + RLS
```

## When to extract a service

Extract only when at least one is true:

- A workload needs independent scaling (e.g., heavy AI report generation)
- A different runtime is required (long-running jobs, GPU)
- A clear team ownership boundary exists

Likely first extract candidates (later): AI report workers, analytics pipelines (BigQuery), webhook processors.

## Why not a separate backend now?

A second service doubles deploy surface, auth token plumbing, CORS/config, and local DX cost. For learning and MVP speed, keep one deployable with clean internal modules.

## What companies commonly do

- Early-stage SaaS: Next.js / Rails / Django monoliths
- Later: carve out workers (Cloud Run / Cloud Functions) for async jobs

## What you should learn

- Server Actions vs REST endpoints trade-offs
- Keeping business logic out of route files
- Designing for extractability without extracting early
