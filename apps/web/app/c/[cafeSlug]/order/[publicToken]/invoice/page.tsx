import Link from "next/link";
import { notFound } from "next/navigation";

import { getGuestInvoice } from "@/features/billing/actions";
import { InvoiceWorkspace } from "@/features/billing/components/invoice-workspace";
import { getGuestOrderByToken } from "@/features/orders/actions";
import { ensureGuestSessionId } from "@/features/orders/guest-session";
import { ThemeToggle } from "@/components/theme-toggle";

type GuestInvoicePageProps = {
  params: Promise<{ cafeSlug: string; publicToken: string }>;
};

export const metadata = {
  title: "Invoice · Ordra",
  robots: { index: false, follow: false },
};

export default async function CafeGuestInvoicePage({ params }: GuestInvoicePageProps) {
  const { cafeSlug, publicToken } = await params;
  await ensureGuestSessionId();
  const [order, invoice] = await Promise.all([
    getGuestOrderByToken(publicToken),
    getGuestInvoice(publicToken),
  ]);

  if (!order || !invoice) notFound();
  if (order.cafe_slug && order.cafe_slug !== cafeSlug) notFound();

  const orderHref = `/c/${encodeURIComponent(cafeSlug)}/order/${encodeURIComponent(publicToken)}`;

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6">
      <InvoiceWorkspace
        invoice={invoice}
        back={
          <div className="mx-auto flex max-w-2xl items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-muted-foreground text-sm">
                <Link
                  href={orderHref}
                  className="hover:text-foreground underline-offset-4 hover:underline"
                >
                  ← Order
                </Link>
              </p>
              <h1 className="text-2xl font-semibold tracking-tight">Invoice</h1>
              <p className="text-muted-foreground text-sm">{invoice.invoice_number}</p>
            </div>
            <ThemeToggle />
          </div>
        }
      />
    </div>
  );
}
