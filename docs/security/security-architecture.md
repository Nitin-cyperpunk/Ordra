# Security Architecture

## Goals

Protect cafe data, customer PII, payments metadata, and platform integrity in a multi-tenant SaaS.

## Controls (by layer)

1. **Transport** — HTTPS only in deployed environments
2. **Authentication** — Supabase Auth (session cookies via `@supabase/ssr`)
3. **Authorization** — RBAC memberships + RLS
4. **Validation** — Zod on all inputs (client + server)
5. **Secrets** — Never in git; Vercel/GCP Secret Manager later
6. **Monitoring** — Sentry + structured logs for abuse/anomaly signals

## Non-negotiables

- Do not bypass AuthN / AuthZ / RLS / validation / tenant isolation
- Do not expose `SUPABASE_SERVICE_ROLE_KEY` to the browser
- Do not put authorization decisions in user-editable `user_metadata`

## Threat categories

See [threat-model.md](./threat-model.md).
