import Link from "next/link";
import { notFound } from "next/navigation";

import { getCafeInvoice } from "@/features/billing/actions";
import { InvoiceWorkspace } from "@/features/billing/components/invoice-workspace";
import { getCafeById } from "@/features/cafes/actions";
import { requireCafeAccess } from "@/features/memberships/access";

type InvoiceDetailPageProps = {
  params: Promise<{ cafeId: string; invoiceId: string }>;
};

export async function generateMetadata({ params }: InvoiceDetailPageProps) {
  const { cafeId, invoiceId } = await params;
  const invoice = await getCafeInvoice(cafeId, invoiceId);
  return {
    title: invoice ? `${invoice.invoice_number} · Ordra` : "Invoice · Ordra",
    robots: { index: false, follow: false },
  };
}

export default async function CafeInvoiceDetailPage({ params }: InvoiceDetailPageProps) {
  const { cafeId, invoiceId } = await params;
  await requireCafeAccess(cafeId);
  const [cafe, invoice] = await Promise.all([
    getCafeById(cafeId),
    getCafeInvoice(cafeId, invoiceId),
  ]);

  if (!invoice) notFound();

  return (
    <InvoiceWorkspace
      invoice={invoice}
      back={
        <div className="space-y-2">
          <p className="text-muted-foreground text-sm">
            <Link
              href={`/dashboard/cafes/${cafeId}/billing`}
              className="hover:text-foreground underline-offset-4 hover:underline"
            >
              ← Billing
            </Link>
          </p>
          <h2 className="text-2xl font-semibold tracking-tight">
            {invoice.invoice_number}
          </h2>
          <p className="text-muted-foreground text-sm">
            {cafe?.name ?? invoice.cafe_name} · print-ready bill
          </p>
          <p className="text-muted-foreground text-sm">
            <Link
              href={`/dashboard/cafes/${cafeId}/orders/${invoice.order_id}`}
              className="hover:text-foreground underline-offset-4 hover:underline"
            >
              View order
            </Link>
          </p>
        </div>
      }
    />
  );
}
