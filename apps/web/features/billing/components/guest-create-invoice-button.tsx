"use client";

import { issueGuestInvoiceAction } from "@/features/billing/actions";
import {
  CreateInvoiceButton,
  type InvoicePreviewLine,
} from "@/features/billing/components/create-invoice-button";

type GuestCreateInvoiceButtonProps = {
  publicToken: string;
  successHref: string;
  cafeName: string;
  currency: string;
  total: string;
  items: InvoicePreviewLine[];
};

export function GuestCreateInvoiceButton({
  publicToken,
  successHref,
  cafeName,
  currency,
  total,
  items,
}: GuestCreateInvoiceButtonProps) {
  return (
    <CreateInvoiceButton
      cafeName={cafeName}
      currency={currency}
      total={total}
      items={items}
      issue={() => issueGuestInvoiceAction({ publicToken })}
      getSuccessHref={() => successHref}
    />
  );
}
