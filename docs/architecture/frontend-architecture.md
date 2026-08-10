# Frontend Architecture

## Stack

- Next.js App Router
- React + TypeScript (strict)
- Tailwind CSS + shadcn/ui + Radix UI
- React Hook Form + Zod
- Lucide Icons

## Structure

```text
apps/web/
├── app/                 # Routes only — thin composition layer
├── components/          # Reusable UI (ui, layout, shared)
├── features/            # Domain modules (menu, orders, …)
├── lib/                 # Infrastructure clients & helpers
├── hooks/
├── types/
└── config/
```

## Rules

- Routes in `app/` should stay thin: fetch/compose, do not embed business rules.
- Domain logic lives in `features/<domain>/`.
- Shared primitives live in `components/ui` (shadcn). Promote to `packages/ui` only when a second app needs them.
- Prefer Server Components by default; use Client Components for interactivity.

## Why this shape?

Feature folders keep cafe operations (menu, tables, KDS) discoverable as the codebase grows. Colocating UI + hooks + actions per feature avoids a giant `components/` dumping ground.

## Alternatives considered

| Approach | Why not (yet) |
|---|---|
| Pages Router | App Router is the Next.js future; RSC + layouts fit SaaS dashboards |
| Separate design-system package first | Overkill until multiple apps share UI |
| CSS-in-JS | Tailwind + shadcn is faster for product UI and works well with RSC |

## What you should learn

- Server vs Client Components trade-offs
- Form validation with Zod at the boundary
- Building accessible UI on Radix primitives
