# Authorization & RBAC

## Model

Role-Based Access Control scoped to a cafe (tenant).

### Planned roles (v1 draft)

| Role | Scope | Capabilities (planned) |
|---|---|---|
| `owner` | cafe | Full cafe admin |
| `manager` | cafe | Staff, menu, reports |
| `cashier` | cafe | Billing, orders |
| `kitchen` | cafe | KDS / order prep |
| `waiter` | cafe | Table orders |
| `super_admin` | platform | Cross-tenant support |

## Enforcement

1. **Application layer** — check membership before mutations
2. **Database layer** — RLS policies must still enforce isolation
3. Never rely on UI hiding alone

## What you should learn

- Defense in depth (app + DB)
- Principle of least privilege
- Avoiding BOLA/IDOR on tenant resources
