import Link from "next/link";
import { notFound } from "next/navigation";

import { getCafeById } from "@/features/cafes/actions";
import { requireCafeAccess } from "@/features/memberships/access";
import { QrPrintCard } from "@/features/qr/components/qr-print-card";
import { buildCafeMenuUrl, buildQrDownloadBasename } from "@/features/qr/urls";

type CafeQrPageProps = {
  params: Promise<{ cafeId: string }>;
};

export async function generateMetadata({ params }: CafeQrPageProps) {
  const { cafeId } = await params;
  const cafe = await getCafeById(cafeId);
  return {
    title: cafe ? `Cafe QR · ${cafe.name}` : "Cafe QR · Ordra",
    robots: { index: false, follow: false },
  };
}

export default async function CafeQrPage({ params }: CafeQrPageProps) {
  const { cafeId } = await params;
  await requireCafeAccess(cafeId);
  const cafe = await getCafeById(cafeId);
  if (!cafe) notFound();

  const url = buildCafeMenuUrl(cafe.slug);
  const basename = buildQrDownloadBasename({ cafeSlug: cafe.slug });

  return (
    <main className="space-y-6">
      <div className="space-y-2 print:hidden">
        <p className="text-muted-foreground text-sm">
          <Link
            href={`/dashboard/cafes/${cafeId}/tables`}
            className="hover:text-foreground underline-offset-4 hover:underline"
          >
            ← Tables
          </Link>
        </p>
        <h2 className="text-2xl font-semibold tracking-tight">Cafe QR</h2>
        <p className="text-muted-foreground text-sm">
          Preview matches the printed card. Download the raw QR or print the full card for
          your entrance or shared surfaces.
        </p>
      </div>

      <QrPrintCard
        url={url}
        downloadBasename={basename}
        label={`QR code for ${cafe.name} public menu`}
        cafeName={cafe.name}
        cafeLogoUrl={cafe.logo_url}
        tagline={cafe.description}
      />
    </main>
  );
}
