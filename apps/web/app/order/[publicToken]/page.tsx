import Link from "next/link";
import { notFound } from "next/navigation";

import { getGuestOrderByToken } from "@/features/orders/actions";
import { GuestOrderTracker } from "@/features/orders/components/guest-order-tracker";
import { ensureGuestSessionId } from "@/features/orders/guest-session";
import { GuestOrderRefresh } from "@/features/orders/components/guest-order-refresh";

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
  const order = await getGuestOrderByToken(publicToken);

  if (!order) {
    notFound();
  }

  return (
    <div className="min-h-screen">
      <GuestOrderRefresh
        enabled={order.status !== "completed" && order.status !== "rejected"}
      />
      <GuestOrderTracker order={order} />
      <p className="text-muted-foreground pb-10 text-center text-xs">
        <Link href="/" className="underline-offset-4 hover:underline">
          Powered by Ordra
        </Link>
      </p>
    </div>
  );
}
