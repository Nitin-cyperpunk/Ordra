# ADR-002: Next.js Application Architecture

## Context

We need a full-stack TypeScript web app for dashboards, marketing, and APIs, optimized for learning and shipping.

## Decision

Use **Next.js App Router** with Server Components, Server Actions, and Route Handlers in `apps/web`, organized by feature folders.

## Alternatives

- Separate React SPA + NestJS/Express API
- Remix
- Pages Router

## Trade-offs

- **Pros:** One language, great DX, Vercel-native, RSC reduces client JS
- **Cons:** Backend coupling to Next.js; long-running jobs unfit for request lifecycle

## Consequences

- Business logic lives in `features/` and `lib/`, not in React components
- Extraction to Cloud Run workers remains possible later

## Learning notes

Study the request lifecycle (SSR, RSC payload, actions) deeply — it is the core of modern Next.js systems.
