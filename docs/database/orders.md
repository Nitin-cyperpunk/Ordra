# Orders (Module 11)

Customer table ordering + cafe order management. No payments or invoices.

## Model

- `orders` — cafe + table scoped, per-cafe `order_number`, opaque `public_token`,
  `customer_session_id`, `idempotency_key`, `subtotal`/`total` (equal for now)
- `order_items` — `item_name_snapshot`, `item_price_snapshot`, quantity, line_total
- `cafe_order_counters` — sequential order numbers per cafe

## Status machine

`pending → confirmed → preparing → ready → completed`  
`pending → rejected`

Enforced by `public.transition_order_status`.

## Guest access

- httpOnly cookie `ordra_guest_session` (middleware + place-order)
- Place: `place_customer_order` RPC (service role from server)
- Track: `get_customer_order` RPC (token + session)
- Route: `/order/{public_token}`

## Staff

- Dashboard `/dashboard/cafes/{cafeId}/orders`
- RLS: members SELECT/UPDATE orders for their cafe
- Realtime on `orders` + `router.refresh` fallback

## Price rule

Server loads current menu prices at **order creation** and snapshots them.
Client-sent prices are ignored.

## Migration

`20260815220000_create_orders_and_order_items.sql`
