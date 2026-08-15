import Link from "next/link";
import { notFound } from "next/navigation";

import { getCafeById } from "@/features/cafes/actions";
import { requireCafeAccess } from "@/features/memberships/access";
import { getCafeTableById } from "@/features/tables/actions";
import { QrPrintCard } from "@/features/qr/components/qr-print-card";
import { buildQrDownloadBasename, buildTableMenuUrl } from "@/features/qr/urls";

type TableQrPageProps = {
  params: Promise<{ cafeId: string; tableId: string }>;
};

export async function generateMetadata({ params }: TableQrPageProps) {
  const { cafeId, tableId } = await params;
  const [cafe, table] = await Promise.all([
    getCafeById(cafeId),
    getCafeTableById(cafeId, tableId),
  ]);
  return {
    title: cafe && table ? `Table ${table.code} QR · ${cafe.name}` : "Table QR · Ordra",
    robots: { index: false, follow: false },
  };
}

export default async function TableQrPage({ params }: TableQrPageProps) {
  const { cafeId, tableId } = await params;
  await requireCafeAccess(cafeId);

  const [cafe, table] = await Promise.all([
    getCafeById(cafeId),
    getCafeTableById(cafeId, tableId),
  ]);

  if (!cafe || !table) notFound();

  const isActive = table.status === "active";
  const url = buildTableMenuUrl(cafe.slug, table.public_token);
  const basename = buildQrDownloadBasename({
    cafeSlug: cafe.slug,
    tableCode: table.code,
  });

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
        <h2 className="text-2xl font-semibold tracking-tight">Table QR</h2>
        <p className="text-muted-foreground text-sm">
          Preview matches the printed card for table {table.code}.
        </p>
        {!isActive ? (
          <p
            role="status"
            className="border-warning/30 bg-warning-muted text-warning-foreground rounded-md border px-3 py-2 text-sm"
          >
            This table is inactive. Guests scanning this QR will see the menu without
            table context until you activate the table again.
          </p>
        ) : null}
      </div>

      <QrPrintCard
        url={url}
        downloadBasename={basename}
        label={`QR code for ${cafe.name} table ${table.code}`}
        cafeName={cafe.name}
        cafeLogoUrl={cafe.logo_url}
        tableLabel={table.code}
        tagline={cafe.description}
      />
    </main>
  );
}
