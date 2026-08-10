# ADR-001: Monorepo Architecture

## Context

Ordra will grow into multiple apps (web, future workers, maybe mobile) and shared libraries (types, validation, UI). We need a structure that keeps boundaries clear without premature microrepos.

## Decision

Use a **pnpm workspaces + Turborepo** monorepo with `apps/` and `packages/`.

## Alternatives

- Polyrepo (separate repos per package)
- npm/yarn workspaces without Turborepo
- Nx

## Trade-offs

- **Pros:** Shared types/validation, atomic cross-package changes, unified CI
- **Cons:** Repo complexity, need discipline to avoid spaghetti imports

## Consequences

- All packages use workspace protocol (`workspace:*`)
- Turborepo caches lint/typecheck/build
- New packages are added only when reuse is real

## Learning notes

Monorepos are used by Vercel, Google (large scale), and many startups. Learn package boundaries and task graphs — not tool worship.
