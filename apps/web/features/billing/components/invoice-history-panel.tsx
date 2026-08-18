"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import {
  formatInvoiceIssuedAt,
  formatInvoiceMoney,
  invoiceStatusLabel,
} from "@/features/billing/invoice-logic";
import type { InvoiceListRow } from "@/features/billing/types";
import { formatInvoiceOrderNumber } from "@/features/billing/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const RANGES = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "7d", label: "Last 7 days" },
  { value: "all", label: "All" },
] as const;

type InvoiceHistoryPanelProps = {
  cafeId: string;
  currency: string;
  invoices: InvoiceListRow[];
  page: number;
  hasMore: boolean;
  range: string;
  q: string;
};

export function InvoiceHistoryPanel({
  cafeId,
  currency,
  invoices,
  page,
  hasMore,
  range,
  q,
}: InvoiceHistoryPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, start] = useTransition();

  function pushParams(patch: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (!value) params.delete(key);
      else params.set(key, value);
    }
    start(() => {
      router.push(`/dashboard/cafes/${cafeId}/billing?${params.toString()}`);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {RANGES.map((entry) => (
          <Button
            key={entry.value}
            type="button"
            size="sm"
            variant={range === entry.value ? "default" : "outline"}
            className="min-h-11"
            disabled={pending}
            onClick={() => pushParams({ range: entry.value, page: "1" })}
          >
            {entry.label}
          </Button>
        ))}
      </div>

      <form
        className="flex flex-wrap gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          pushParams({ q: String(form.get("q") ?? "").trim() || null, page: "1" });
        }}
      >
        <Input
          name="q"
          defaultValue={q}
          placeholder="Search invoice #, order #, or customer"
          className="min-h-11 max-w-sm"
          aria-label="Search invoices"
        />
        <Button type="submit" variant="secondary" className="min-h-11" disabled={pending}>
          Search
        </Button>
      </form>

      {invoices.length === 0 ? (
        <p className="text-muted-foreground rounded-lg border border-dashed p-8 text-center text-sm">
          No invoices in this range.
        </p>
      ) : (
        <ul className="divide-y rounded-xl border">
          {invoices.map((invoice) => {
            const issued = formatInvoiceIssuedAt(invoice.issued_at);
            return (
              <li key={invoice.id}>
                <Link
                  href={`/dashboard/cafes/${cafeId}/billing/${invoice.id}`}
                  className="hover:bg-muted/40 flex flex-wrap items-center justify-between gap-3 px-4 py-3 transition-colors"
                >
                  <div>
                    <p className="font-medium">
                      {invoice.invoice_number} ·{" "}
                      {formatInvoiceOrderNumber(invoice.order_number)}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {issued.date}
                      {invoice.customer_name ? ` · ${invoice.customer_name}` : ""}
                      {invoice.table_code ? ` · Table ${invoice.table_code}` : ""} ·{" "}
                      {invoiceStatusLabel(invoice.status)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-semibold tabular-nums">
                      {formatInvoiceMoney(invoice.total_amount, currency)}
                    </p>
                    <span className="text-sm font-medium underline-offset-4 hover:underline">
                      View
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          className="min-h-11"
          disabled={pending || page <= 1}
          onClick={() => pushParams({ page: String(page - 1) })}
        >
          Previous
        </Button>
        <Button
          type="button"
          variant="outline"
          className="min-h-11"
          disabled={pending || !hasMore}
          onClick={() => pushParams({ page: String(page + 1) })}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
