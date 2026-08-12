import type { Metadata } from "next";

import { CafeBusinessForm } from "@/features/cafes/components/cafe-business-form";
import { requireCafeAccess } from "@/features/memberships/access";
import { canEditCafeSettings } from "@/features/memberships/types";

type BusinessSettingsPageProps = {
  params: Promise<{ cafeId: string }>;
};

export const metadata: Metadata = {
  title: "Business settings · Ordra",
  robots: { index: false, follow: false },
};

export default async function CafeBusinessSettingsPage({
  params,
}: BusinessSettingsPageProps) {
  const { cafeId } = await params;
  const { cafe, role } = await requireCafeAccess(cafeId);

  return (
    <main className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight">Business configuration</h2>
        <p className="text-muted-foreground text-sm">
          Timezone, currency, and cafe status.
        </p>
      </div>
      {canEditCafeSettings(role) ? (
        <CafeBusinessForm cafe={cafe} />
      ) : (
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-muted-foreground">Timezone</dt>
            <dd>{cafe.timezone}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Currency</dt>
            <dd>{cafe.currency}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Status</dt>
            <dd className="capitalize">{cafe.status}</dd>
          </div>
        </dl>
      )}
    </main>
  );
}
