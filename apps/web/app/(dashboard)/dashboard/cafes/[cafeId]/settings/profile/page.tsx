import type { Metadata } from "next";

import { CafeProfileForm } from "@/features/cafes/components/cafe-profile-form";
import { requireCafeAccess } from "@/features/memberships/access";
import { canEditCafeSettings } from "@/features/memberships/types";

type ProfileSettingsPageProps = {
  params: Promise<{ cafeId: string }>;
};

export const metadata: Metadata = {
  title: "Cafe profile · Ordra",
  robots: { index: false, follow: false },
};

export default async function CafeProfileSettingsPage({
  params,
}: ProfileSettingsPageProps) {
  const { cafeId } = await params;
  const { cafe, role } = await requireCafeAccess(cafeId);

  return (
    <main className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight">Cafe information</h2>
        <p className="text-muted-foreground text-sm">
          Name, description, contact, and address. Description is plain text only (not
          HTML).
        </p>
      </div>
      {canEditCafeSettings(role) ? (
        <CafeProfileForm cafe={cafe} />
      ) : (
        <ProfileReadOnly cafe={cafe} />
      )}
    </main>
  );
}

function ProfileReadOnly({
  cafe,
}: {
  cafe: Awaited<ReturnType<typeof requireCafeAccess>>["cafe"];
}) {
  return (
    <dl className="space-y-3 text-sm">
      <div>
        <dt className="text-muted-foreground">Name</dt>
        <dd>{cafe.name}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Description</dt>
        <dd className="whitespace-pre-wrap">{cafe.description || "—"}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Phone</dt>
        <dd>{cafe.phone || "—"}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Email</dt>
        <dd>{cafe.email || "—"}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Website</dt>
        <dd>{cafe.website || "—"}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Address</dt>
        <dd>
          {[
            cafe.address_line1,
            cafe.address_line2,
            cafe.city,
            cafe.state,
            cafe.postal_code,
            cafe.country,
          ]
            .filter(Boolean)
            .join(", ") || "—"}
        </dd>
      </div>
    </dl>
  );
}
