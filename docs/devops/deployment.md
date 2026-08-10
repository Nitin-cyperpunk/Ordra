# Deployment

## Phase 1 — Vercel + Supabase

1. Connect GitHub repo to Vercel
2. Set environment variables from `.env.example`
3. Deploy `apps/web` as the Vercel project root (or set app directory)
4. Point production domain when ready

## Phase 2 — Google Cloud Run (future)

1. Build image via `infrastructure/docker/Dockerfile`
2. Push to Artifact Registry
3. Deploy Cloud Run service
4. Secrets from Secret Manager
5. Keep Supabase as managed Postgres unless migrating DB

## Why not deploy production in this foundation?

Product modules do not exist yet. Shipping empty infra creates operational noise without user value.

## Rollback strategy (later)

- Vercel instant rollbacks
- Cloud Run revision traffic splitting
