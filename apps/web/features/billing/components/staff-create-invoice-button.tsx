"use client";

import { issueInvoiceForOrderAction } from "@/features/billing/actions";
import {
  CreateInvoiceButton,
  type InvoicePreviewLine,
} from "@/features/billing/components/create-invoice-button";

type StaffCreateInvoiceButtonProps = {
  cafeId: string;
  orderId: string;
  cafeName: string;
  currency: string;
  total: string;
  items: InvoicePreviewLine[];
};

export function StaffCreateInvoiceButton({
  cafeId,
  orderId,
  cafeName,
  currency,
  total,
  items,
}: StaffCreateInvoiceButtonProps) {
  return (
    <CreateInvoiceButton
      cafeName={cafeName}
      currency={currency}
      total={total}
      items={items}
      issue={() => issueInvoiceForOrderAction({ cafeId, orderId })}
      getSuccessHref={(invoiceId) => `/dashboard/cafes/${cafeId}/billing/${invoiceId}`}
    />
  );
}
