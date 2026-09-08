# Invoices (Module 14)

Cafe bills generated from **completed orders**. No payments, GST engine, or Razorpay.

## Model

- `invoices` — one row per order (`invoices_order_unique`). Letterhead, prices, and totals are **snapshots**.
- `invoice_items` — item name/price/qty snapshots from `order_items`.
- `cafe_invoice_counters` — sequential numbers per cafe (not granted to clients).

Invoice numbers are server-generated: `INV-YYYY-000001`.

`tax_amount` and `discount_amount` default to **0**. Module 14 does not invent tax. Printed totals follow `orders.total` (= subtotal today).

## Access

Staff (cafe members):

- `SELECT` invoices for their cafe (RLS)
- Create via `public.issue_invoice_for_order(order_id)` (`auth.uid()` + membership)
- Routes: `/dashboard/cafes/{cafeId}/billing`, `/dashboard/cafes/{cafeId}/billing/{invoiceId}`

Guests:

- Create/read via service-role RPCs `issue_guest_invoice` / `get_customer_invoice` (token + session cookie)
- Route: `/c/{slug}/order/{publicToken}/invoice`

Clients cannot insert, update, or supply invoice numbers. Duplicate create returns the existing invoice.

## Migrations

- `20260819100000_create_invoices.sql`
