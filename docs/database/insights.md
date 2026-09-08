# Cafe Insights (Module 15)

Owner/staff analytics from **completed orders**. No LLM. Module 16 will add AI recommendations later.

## Metrics

| Metric | Definition |
|---|---|
| Revenue | `sum(orders.total)` where `status = completed` and `completed_at` in range |
| Orders | Count of those completed orders |
| AOV | Revenue ÷ completed orders (0 when none) |
| Cancelled | `status = rejected` with `rejected_at` in range |
| Guest sessions | Distinct `customer_session_id` on completed orders (cookie identity, not CRM) |
| Top items | Aggregated `order_items` snapshots on completed orders |
| Categories | Join snapshot lines → `menu_items` → `menu_categories` when FK still present |
| Peak hours / days | Cafe-local buckets via `cafes.timezone` |

Cancelled and in-progress orders are **not** revenue.

## Access

- Route: `/dashboard/cafes/{cafeId}/insights`
- RPC: `public.get_cafe_insights(...)` — `authenticated` + cafe membership
- RLS still applies to underlying tables; RPC is SECURITY DEFINER with membership check

## Migration

- `20260908090000_create_cafe_insights.sql`
  - partial indexes on `(cafe_id, completed_at)` / `(cafe_id, rejected_at)`
  - `get_cafe_insights` aggregation function
