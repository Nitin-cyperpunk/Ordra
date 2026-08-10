# ADR-003: Supabase / PostgreSQL

## Context

Ordra needs relational data, auth, file storage, and realtime updates for kitchen/order flows.

## Decision

Use **Supabase** (hosted PostgreSQL + Auth + Storage + Realtime) as the primary data platform.

## Alternatives

- Self-managed Postgres on Cloud SQL only
- PlanetScale / other serverless SQL (weaker RLS story)
- Firebase (document model less ideal for relational cafe ops)

## Trade-offs

- **Pros:** Fast auth+RLS integration, realtime, storage, great for SaaS MVP
- **Cons:** Vendor coupling; advanced Postgres ops may eventually need Cloud SQL

## Consequences

- Schema and RLS are first-class
- Migrations live under `database/`
- Service role key is server-only

## Learning notes

Master Postgres + RLS — transferable even if you leave Supabase later.
