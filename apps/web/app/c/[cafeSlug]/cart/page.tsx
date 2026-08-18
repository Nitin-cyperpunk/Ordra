import Link from "next/link";
import { notFound } from "next/navigation";

import { CartProvider } from "@/features/orders/components/cart-provider";
import { CartReview } from "@/features/orders/components/cart-review";
import { ensureGuestSessionId } from "@/features/orders/guest-session";
import { getPublicMenuBySlug } from "@/features/public-menu/queries";

type CartPageProps = {
  params: Promise<{ cafeSlug: string }>;
  searchParams: Promise<{ table?: string }>;
};

export async function generateMetadata({ params }: CartPageProps) {
  const { cafeSlug } = await params;
  const menu = await getPublicMenuBySlug(cafeSlug);
  return {
    title: menu ? `Cart · ${menu.cafe.name}` : "Cart · Ordra",
    robots: { index: false, follow: false },
  };
}

export default async function PublicCartPage({ params, searchParams }: CartPageProps) {
  const { cafeSlug } = await params;
  const { table: tableToken } = await searchParams;
  await ensureGuestSessionId();
  const menu = await getPublicMenuBySlug(cafeSlug, tableToken);

  if (!menu) notFound();

  const table = menu.table;
  const backHref = table
    ? `/c/${encodeURIComponent(menu.cafe.slug)}?table=${encodeURIComponent(table.publicToken)}`
    : `/c/${encodeURIComponent(menu.cafe.slug)}`;

  return (
    <CartProvider
      cafeSlug={menu.cafe.slug}
      tableToken={table?.publicToken ?? null}
      tableCode={table?.code ?? null}
      currency={menu.cafe.currency}
    >
      <main className="mx-auto min-h-screen w-full max-w-lg space-y-6 px-4 py-8 sm:px-6">
        <div className="space-y-2">
          <p className="text-muted-foreground text-sm">
            <Link
              href={backHref}
              className="hover:text-foreground underline-offset-4 hover:underline"
            >
              ← Menu
            </Link>
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">Your cart</h1>
          <p className="text-muted-foreground text-sm">{menu.cafe.name}</p>
        </div>
        <CartReview cafeName={menu.cafe.name} menuItems={menu.items} />
      </main>
    </CartProvider>
  );
}
