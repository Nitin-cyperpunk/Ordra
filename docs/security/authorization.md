# Authorization & RBAC

## Model

Role-Based Access Control scoped to a cafe (tenant).

## Roles (Module 3)

| Role | Scope | Capabilities |
|---|---|---|
| `owner` | cafe | Full cafe settings, manage all memberships/invites |
| `manager` | cafe | Edit cafe settings, invite/manage staff only |
| `staff` | cafe | View cafe + team; no settings/membership mutations |

Ownership transfer is intentionally blocked (`owner_id` immutable; cannot invite/assign `owner` via invites).

## Enforcement

1. **Application layer** — check membership role before mutations
2. **Database layer** — RLS on `memberships`, `cafe_invitations`, and membership-aware `cafes` policies
3. Never rely on UI hiding alone

## What you should learn

- Defense in depth (app + DB)
- Principle of least privilege
- Avoiding BOLA/IDOR on tenant resources
