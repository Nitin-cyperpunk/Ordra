import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getGuestInvoice } from "@/features/billing/actions";
import { getGuestOrderByToken } from "@/features/orders/actions";
import { GuestOrderTracker } from "@/features/orders/components/guest-order-tracker";
import { GuestOrderRefresh } from "@/features/orders/components/guest-order-refresh";
import { ensureGuestSessionId } from "@/features/orders/guest-session";

type OrderTrackPageProps = {
  params: Promise<{ publicToken: string }>;
};

export const metadata = {
  title: "Track order · Ordra",
  robots: { index: false, follow: false },
};

export default async function OrderTrackPage({ params }: OrderTrackPageProps) {
  const { publicToken } = await params;
  await ensureGuestSessionId();
  const [order, invoice] = await Promise.all([
    getGuestOrderByToken(publicToken),
    getGuestInvoice(publicToken),
  ]);

  if (!order) {
    notFound();
  }

  if (order.cafe_slug) {
    redirect(
      `/c/${encodeURIComponent(order.cafe_slug)}/order/${encodeURIComponent(publicToken)}`,
    );
  }

  return (
    <div className="min-h-screen">
      <GuestOrderRefresh
        enabled={order.status !== "completed" && order.status !== "rejected"}
      />
      <GuestOrderTracker
        order={order}
        hasInvoice={Boolean(invoice)}
        invoiceHref={`/order/${encodeURIComponent(publicToken)}/invoice`}
      />
      <p className="text-muted-foreground pb-10 text-center text-xs">
        <Link href="/" className="underline-offset-4 hover:underline">
          Powered by Ordra
        </Link>
      </p>
    </div>
  );
}
