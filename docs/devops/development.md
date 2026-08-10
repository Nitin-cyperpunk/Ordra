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

Prefer **Supabase CLI** (Auth + RLS fidelity):

```bash
pnpm db:start
pnpm db:status -o env
```

See [supabase-local.md](./supabase-local.md).

Bare Postgres via Docker Compose remains available for experiments only:

```bash
docker compose -f infrastructure/docker/docker-compose.yml --profile local-db up -d postgres
```

## Quality commands

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm format
pnpm build
```
