# Orders (Modules 11–12)

Customer table ordering + cafe kitchen / order operations. No payments or invoices.

## Model

- `orders` — cafe + table scoped, per-cafe `order_number`, opaque `public_token`,
  `customer_session_id`, `idempotency_key`, `subtotal`/`total` (equal for now),
  optional `rejection_reason`
- `order_items` — `item_name_snapshot`, `item_price_snapshot`, quantity, line_total
- `cafe_order_counters` — sequential order numbers per cafe
- `order_status_history` — append-only status audit (Module 12)

## Status machine

`pending → confirmed → preparing → ready → completed`  
`pending → rejected` (shown as Cancelled in ops UI)

Enforced by `public.transition_order_status(order_id, next, note?)`.

## Guest access

- httpOnly cookie `ordra_guest_session` (middleware + place-order)
- Place: `place_customer_order` RPC (service role from server)
- Track: `get_customer_order` RPC (token + session) + poll refresh
- Routes: `/c/{slug}/order/{public_token}` (confirmation + track), `/order/{public_token}` redirects when slug is known

## Staff / kitchen

- Board: `/dashboard/cafes/{cafeId}/orders` (Kanban: New → Accepted → Preparing → Ready)
- Kitchen mode: `/dashboard/cafes/{cafeId}/kitchen`
- History: `/dashboard/cafes/{cafeId}/orders/history`
- RLS: members SELECT/UPDATE orders for their cafe; history SELECT for members
- Realtime on `orders` + reconnect banner + optional local sound

## Price rule

Server loads current menu prices at **order creation** and snapshots them.
Client-sent prices are ignored.

## Migrations

- `20260815220000_create_orders_and_order_items.sql` (Module 11)
- `20260817090000_create_order_status_history.sql` (Module 12)
