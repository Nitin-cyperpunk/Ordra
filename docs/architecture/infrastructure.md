# Infrastructure Architecture

## Current (Phase 0–1)

| Concern | Choice |
|---|---|
| App hosting | Vercel |
| Database / Auth / Storage | Supabase |
| CI | GitHub Actions |
| Container foundation | Docker (prepared, not required for Vercel) |

## Future (Phase 2+)

| Concern | Choice |
|---|---|
| Compute | Google Cloud Run |
| Secrets | GCP Secret Manager |
| AI | Vertex AI |
| Jobs | Cloud Scheduler + Cloud Functions / Run jobs |
| Analytics warehouse | BigQuery |
| Observability | Cloud Monitoring + Logging + Sentry |

## Why Vercel first?

- Fastest path for Next.js
- Preview deployments for PRs
- Low ops burden while product-market fit is uncertain

## Why prepare Docker / GCP now?

So migration is a known path, not a rewrite. Docker Compose supports optional local Postgres; production may stay on Supabase-managed Postgres even when the app moves to Cloud Run.

## What we are NOT adding yet

- **Kubernetes** — unnecessary operational complexity for a single Next.js app and managed DB. Learn K8s later if you operate many services.
- **Redis** — add when you have a concrete need (rate limits, queues, session store beyond cookies).
- **Service mesh / multi-region** — premature until traffic and SLAs demand it.

## What you should learn

- Difference between PaaS (Vercel) and containers (Cloud Run)
- Twelve-factor config via env vars / Secret Manager
- Cost control: managed services vs self-hosted
