# ADR-004: Multi-Tenant Architecture

## Context

Ordra is a B2B SaaS serving many cafes. Tenant isolation is a security and product requirement.

## Decision

Use **shared database + shared schema + `cafe_id` column + PostgreSQL RLS**.

## Alternatives

- Database-per-tenant
- Schema-per-tenant
- Application-only filtering without RLS

## Trade-offs

- **Pros:** Operable by a small team; proven SaaS pattern; RLS is a hard backstop
- **Cons:** A single RLS mistake can leak data; noisy-neighbor performance risk at huge scale

## Consequences

- Every tenant-owned resource must include `cafe_id`
- Membership tables drive authorization
- Super-admin access is explicit and audited

## Learning notes

This is how many multi-tenant SaaS products start. Learn to treat RLS as mandatory, not optional.
