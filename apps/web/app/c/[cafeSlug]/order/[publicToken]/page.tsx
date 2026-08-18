import { notFound } from "next/navigation";

import { getGuestOrderByToken } from "@/features/orders/actions";
import { GuestOrderTracker } from "@/features/orders/components/guest-order-tracker";
import { GuestOrderRefresh } from "@/features/orders/components/guest-order-refresh";
import { ensureGuestSessionId } from "@/features/orders/guest-session";

type CafeOrderTrackPageProps = {
  params: Promise<{ cafeSlug: string; publicToken: string }>;
};

export const metadata = {
  title: "Order · Ordra",
  robots: { index: false, follow: false },
};

export default async function CafeGuestOrderPage({ params }: CafeOrderTrackPageProps) {
  const { cafeSlug, publicToken } = await params;
  await ensureGuestSessionId();
  const order = await getGuestOrderByToken(publicToken);

  if (!order) {
    notFound();
  }

  if (order.cafe_slug && order.cafe_slug !== cafeSlug) {
    notFound();
  }

  return (
    <div className="min-h-screen">
      <GuestOrderRefresh
        enabled={order.status !== "completed" && order.status !== "rejected"}
      />
      <GuestOrderTracker order={order} />
    </div>
  );
}
