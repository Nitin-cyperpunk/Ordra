# Local Development

## Prerequisites

- Node.js 20+
- pnpm 9+
- Git
- (Optional) Docker Desktop for local Postgres

## Setup

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

App: [http://localhost:3000](http://localhost:3000)

## Optional local database

```bash
docker compose -f infrastructure/docker/docker-compose.yml --profile local-db up -d postgres
```

Prefer Supabase cloud/local CLI for Auth + RLS fidelity.

## Quality commands

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm format
pnpm build
```
