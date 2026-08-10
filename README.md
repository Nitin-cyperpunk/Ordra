# Ordra

<p align="center">
  <img src="apps/web/public/logo.svg" alt="Ordra logo" width="72" height="72" />
</p>

<p align="center">
  <strong>Ordra — Intelligent operations for modern cafes.</strong>
</p>

<p align="center">
  Multi-tenant SaaS operating system for cafes — operations, ordering, billing, analytics, and AI.
</p>

---

## Vision

Ordra helps modern cafes run day-to-day operations and make better decisions. The first vertical is cafes; the architecture supports restaurants, bakeries, cloud kitchens, and hospitality later.

This repository is also a deliberate learning ground for advanced full-stack development, multi-tenant SaaS design, PostgreSQL/RLS, AI engineering, GCP, Docker, CI/CD, and production practices — without sacrificing product seriousness.

## Features (planned)

- Cafe & staff management
- Tables, digital menu, QR ordering
- Kitchen display & billing
- Payments (Razorpay)
- Business intelligence & analytics
- AI advisor, reports, marketing assist
- SaaS subscriptions, feature flags, usage tracking

> Foundation phase: engineering scaffolding only. Product modules ship next.

## Architecture

```text
ordra/
├── apps/web          # Next.js application
├── packages/         # Shared config, types, utils, validation, ui
├── database/         # Migrations, seeds, DB docs
├── infrastructure/   # Docker, GitHub, GCP prep
├── docs/             # Architecture, security, ADRs, product
└── tests/            # Unit, integration, e2e
```

- **Monorepo:** pnpm workspaces + Turborepo
- **App:** Next.js (App Router) — UI + Server Actions + API Routes
- **Data:** Supabase (PostgreSQL, Auth, Storage, Realtime)
- **AI:** Provider abstraction → Vertex AI / Gemini first
- **Deploy:** Vercel initially; Cloud Run path prepared

See [docs/architecture/system-overview.md](docs/architecture/system-overview.md).

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | Next.js, React, TypeScript, Tailwind, shadcn/ui, Radix, Lucide |
| Forms | React Hook Form, Zod |
| Backend | Next.js Server Actions & API Routes |
| Database | PostgreSQL via Supabase |
| Payments | Razorpay (later) |
| AI | Vertex AI / Gemini (later) |
| Cloud | Vercel now; GCP later |
| CI | GitHub Actions |
| Quality | ESLint, Prettier, Husky, lint-staged |

## Local development

### Prerequisites

- Node.js 20+
- [pnpm](https://pnpm.io) 9+

### Setup

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Commands

| Command | Description |
|---|---|
| `pnpm dev` | Start Next.js (Turbopack) |
| `pnpm build` | Build all packages/apps |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | TypeScript `--noEmit` |
| `pnpm test` | Unit tests |
| `pnpm format` | Prettier write |
| `pnpm format:check` | Prettier check |

## Environment setup

Copy `.env.example` → `.env.local` and fill values as modules need them. Never commit secrets.

Groups: Application, Supabase, Authentication, AI, Payments, Email, Google Cloud, Monitoring.

## Testing

Test folders exist under `tests/`. Feature modules will add unit, integration, and e2e coverage. CI runs `pnpm test` on every PR.

## Deployment

- **Initial:** Vercel + Supabase
- **Future:** Google Cloud Run (Docker image ready under `infrastructure/docker/`)
- Production GitHub workflow is present but disabled until deploy is configured

## Roadmap

See [docs/product/roadmap.md](docs/product/roadmap.md).

## Contribution guidelines

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

See [LICENSE](LICENSE).
