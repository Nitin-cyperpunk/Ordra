import type { ReactNode } from "react";

import { InvoiceActions } from "@/features/billing/components/invoice-actions";
import { InvoicePaper } from "@/features/billing/components/invoice-paper";
import type { Invoice } from "@/features/billing/types";

type InvoiceWorkspaceProps = {
  invoice: Invoice;
  back?: ReactNode;
};

export function InvoiceWorkspace({ invoice, back }: InvoiceWorkspaceProps) {
  return (
    <div className="invoice-print-page space-y-6">
      {back ? <div className="print:hidden">{back}</div> : null}
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_15.5rem]">
        <InvoicePaper invoice={invoice} />
        <InvoiceActions invoice={invoice} />
      </div>
    </div>
  );
}
