import { notFound } from "next/navigation";

import { getPublicMenuBySlug } from "@/features/public-menu/queries";
import { PublicMenuExperience } from "@/features/public-menu/components/public-menu-experience";
import { ensureGuestSessionId } from "@/features/orders/guest-session";

type PublicCafeMenuPageProps = {
  params: Promise<{ cafeSlug: string }>;
  searchParams: Promise<{ table?: string }>;
};

export async function generateMetadata({ params }: PublicCafeMenuPageProps) {
  const { cafeSlug } = await params;
  const menu = await getPublicMenuBySlug(cafeSlug);

  if (!menu) {
    return {
      title: "Menu not found · Ordra",
      robots: { index: false, follow: false },
    };
  }

  const description =
    menu.cafe.description?.slice(0, 160) ||
    `Menu for ${menu.cafe.name}${menu.cafe.city ? ` · ${menu.cafe.city}` : ""}`;

  return {
    title: `${menu.cafe.name} · Menu`,
    description,
    robots: { index: true, follow: true },
  };
}

export default async function PublicCafeMenuPage({
  params,
  searchParams,
}: PublicCafeMenuPageProps) {
  const { cafeSlug } = await params;
  const { table: tableToken } = await searchParams;
  await ensureGuestSessionId();
  const menu = await getPublicMenuBySlug(cafeSlug, tableToken);

  if (!menu) {
    notFound();
  }

  return (
    <PublicMenuExperience
      cafe={menu.cafe}
      categories={menu.categories}
      items={menu.items}
      table={menu.table}
      tableUnavailable={menu.tableUnavailable}
    />
  );
}
