# Threat Model (Initial)

## Assets

- Cafe operational data (menus, orders, revenue)
- Staff accounts
- Customer order/contact data
- Payment references
- AI prompts that may include business data

## Top threats

| Threat | Mitigation |
|---|---|
| Cross-tenant data leak | `cafe_id` + RLS + membership checks |
| Privilege escalation | Server-side RBAC; no auth in `user_metadata` |
| Secret leakage | `.env` gitignored; CI secret scanning later |
| Injection | Parameterized queries / Supabase client; Zod validation |
| Payment webhook spoofing | Razorpay signature verification (billing module) |
| Prompt injection / data exfil via AI | Sanitize context; least-privilege tools; audit logs |

## Out of scope for foundation

Penetration testing, formal STRIDE workshops — schedule before public launch.
