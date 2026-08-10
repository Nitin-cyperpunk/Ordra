# Ordra System Overview

## Tagline

**Ordra — Intelligent operations for modern cafes.**

## Purpose

Ordra is a multi-tenant SaaS operating system for cafes, designed to expand into restaurants, bakeries, cloud kitchens, and hospitality businesses.

## High-level architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                         Clients                              │
│         Browser (Cafe staff) · QR guests · Super admin       │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│                     apps/web (Next.js)                       │
│  Marketing · Auth · Dashboard · API Routes · Server Actions  │
└───────┬──────────────┬──────────────┬──────────────┬────────┘
        │              │              │              │
┌───────▼──────┐ ┌─────▼─────┐ ┌──────▼──────┐ ┌─────▼─────┐
│   Supabase   │ │  Vertex   │ │  Razorpay   │ │  Sentry / │
│ Auth · DB ·  │ │ AI Gemini │ │  Payments   │ │  Logging  │
│ Storage · RT │ │           │ │             │ │           │
└──────────────┘ └───────────┘ └─────────────┘ └───────────┘
```

## Design principles

1. **Single deployable app first** — Next.js hosts UI, server actions, and API routes. Extract services only when a clear scaling or team boundary appears.
2. **Multi-tenancy by default** — Every tenant-owned row includes `cafe_id` and is protected by RLS.
3. **Security first** — AuthN, AuthZ, validation, and tenant isolation are never bypassed.
4. **Provider abstractions** — AI and payments are behind interfaces so providers can change without rewriting business logic.
5. **Observability from day one (lightly)** — Structured logging now; Sentry and Cloud Monitoring as modules mature.

## Why not microservices yet?

Microservices add network boundaries, separate deploys, distributed tracing, and operational cost. For a founding team learning and shipping an MVP, a modular monolith (feature folders + clear package boundaries) is the correct default. Companies like Shopify and Basecamp grew large systems from modular monoliths before splitting selectively.

## What you should learn

- How a SaaS maps product domains onto a modular codebase
- Where boundaries belong (tenant, auth, billing, AI) before splitting processes
- Cost of premature infrastructure vs cost of messy coupling
