import {
  formatInvoiceIssuedAt,
  formatInvoiceMoney,
  isPositiveMoney,
} from "@/features/billing/invoice-logic";
import type { Invoice } from "@/features/billing/types";
import { formatInvoiceOrderNumber } from "@/features/billing/types";
import { cn } from "@/lib/utils";

type InvoicePaperProps = {
  invoice: Invoice;
  className?: string;
};

export function InvoicePaper({ invoice, className }: InvoicePaperProps) {
  const issued = formatInvoiceIssuedAt(invoice.issued_at);
  const showTax = isPositiveMoney(invoice.tax_amount);
  const showDiscount = isPositiveMoney(invoice.discount_amount);

  return (
    <article className={cn("invoice-sheet", className)} aria-labelledby="invoice-heading">
      <header className="invoice-sheet__header">
        <p className="invoice-sheet__brand">Ordra</p>
        {invoice.cafe_logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={invoice.cafe_logo_url}
            alt=""
            width={48}
            height={48}
            className="invoice-sheet__logo"
          />
        ) : null}
        <h2 id="invoice-heading" className="invoice-sheet__cafe">
          {invoice.cafe_name}
        </h2>
        {invoice.cafe_address ? (
          <p className="invoice-sheet__meta">{invoice.cafe_address}</p>
        ) : null}
        {invoice.cafe_phone || invoice.cafe_email ? (
          <p className="invoice-sheet__meta">
            {[invoice.cafe_phone, invoice.cafe_email].filter(Boolean).join(" · ")}
          </p>
        ) : null}
      </header>

      <dl className="invoice-sheet__ids">
        <div>
          <dt>Invoice</dt>
          <dd>{invoice.invoice_number}</dd>
        </div>
        <div>
          <dt>Order</dt>
          <dd>{formatInvoiceOrderNumber(invoice.order_number)}</dd>
        </div>
        <div>
          <dt>Date</dt>
          <dd>
            {issued.date}
            {issued.time ? ` · ${issued.time}` : ""}
          </dd>
        </div>
        {invoice.table_code ? (
          <div>
            <dt>Table</dt>
            <dd>{invoice.table_code}</dd>
          </div>
        ) : null}
        {invoice.customer_name ? (
          <div>
            <dt>Customer</dt>
            <dd>{invoice.customer_name}</dd>
          </div>
        ) : null}
        {invoice.customer_phone ? (
          <div>
            <dt>Phone</dt>
            <dd>{invoice.customer_phone}</dd>
          </div>
        ) : null}
      </dl>

      <h3 className="sr-only">Items</h3>
      <ul className="invoice-sheet__lines">
        {invoice.items.map((item) => (
          <li key={item.id}>
            <div>
              <p className="invoice-sheet__mobile-name">{item.name}</p>
              <p className="invoice-sheet__mobile-meta">
                {item.quantity} × {formatInvoiceMoney(item.unit_price, invoice.currency)}
              </p>
            </div>
            <p className="invoice-sheet__mobile-total tabular-nums">
              {formatInvoiceMoney(item.line_total, invoice.currency)}
            </p>
          </li>
        ))}
      </ul>

      <dl className="invoice-sheet__totals">
        <div>
          <dt>Subtotal</dt>
          <dd>{formatInvoiceMoney(invoice.subtotal, invoice.currency)}</dd>
        </div>
        {showTax ? (
          <div>
            <dt>Tax</dt>
            <dd>{formatInvoiceMoney(invoice.tax_amount, invoice.currency)}</dd>
          </div>
        ) : null}
        {showDiscount ? (
          <div>
            <dt>Discount</dt>
            <dd>{formatInvoiceMoney(invoice.discount_amount, invoice.currency)}</dd>
          </div>
        ) : null}
        <div className="invoice-sheet__grand">
          <dt>Total</dt>
          <dd>{formatInvoiceMoney(invoice.total_amount, invoice.currency)}</dd>
        </div>
      </dl>

      {invoice.notes ? (
        <p className="invoice-sheet__notes">Note: {invoice.notes}</p>
      ) : null}

      <p className="invoice-sheet__footer">Thank you · Powered by Ordra</p>
    </article>
  );
}
