# API Conventions

API surface will grow with modules.

## Current endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Liveness check |

## Future conventions

- Version only when breaking external contracts
- Prefer Server Actions for first-party UI mutations
- Use Route Handlers for webhooks and public/machine clients
- Validate all inputs with Zod
- Always enforce tenant context on cafe-scoped resources
