# Ordra Engineering Rules

These rules apply to all AI assistants and human contributors working in this repository.

## 1. Do not over-engineer

Use the simplest architecture that supports the current requirement. Do not add Kubernetes, Redis, message buses, or microservices without a concrete need documented in an ADR.

## 2. Think about future scalability

Design modules and data models so the system can eventually support thousands of cafes. Prefer clear boundaries over premature infrastructure.

## 3. Security first

Never bypass:

- Authentication
- Authorization
- RLS
- Input validation
- Tenant isolation

## 4. Multi-tenancy is mandatory

Every tenant-owned resource must be associated with `cafe_id`.

## 5. Type safety

Use TypeScript strict mode. Avoid `any` unless there is a documented reason in code comments or an ADR.

## 6. Reusability

Before creating a new component or function, check whether an existing implementation can be reused.

## 7. No secrets in Git

Never commit API keys, passwords, service account keys, JWT secrets, or database credentials.

## 8. Scope discipline

Do not implement business feature modules unless explicitly requested. Prefer documentation and interfaces as placeholders.

## 9. Explain important decisions

When making architectural choices, explain why, alternatives, trade-offs, and learning value.
