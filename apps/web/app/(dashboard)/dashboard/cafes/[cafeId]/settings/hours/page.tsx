import type { Metadata } from "next";

import { CafeHoursForm } from "@/features/cafes/components/cafe-hours-form";
import { requireCafeAccess } from "@/features/memberships/access";
import { canEditCafeSettings } from "@/features/memberships/types";
import { WEEKDAYS, type Cafe } from "@/features/cafes/types";

type HoursSettingsPageProps = {
  params: Promise<{ cafeId: string }>;
};

export const metadata: Metadata = {
  title: "Opening hours · Ordra",
  robots: { index: false, follow: false },
};

export default async function CafeHoursSettingsPage({ params }: HoursSettingsPageProps) {
  const { cafeId } = await params;
  const { cafe, role } = await requireCafeAccess(cafeId);

  return (
    <main className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight">Opening hours</h2>
        <p className="text-muted-foreground text-sm">
          Weekly schedule. Special holiday hours come later.
        </p>
      </div>
      {canEditCafeSettings(role) ? (
        <CafeHoursForm cafe={cafe} />
      ) : (
        <HoursReadOnly cafe={cafe} />
      )}
    </main>
  );
}

function HoursReadOnly({ cafe }: { cafe: Cafe }) {
  return (
    <ul className="space-y-2 text-sm">
      {WEEKDAYS.map((day) => {
        const hours = cafe.opening_hours[day];
        return (
          <li key={day} className="flex justify-between border-b py-2 capitalize">
            <span>{day}</span>
            <span className="text-muted-foreground">
              {hours.closed ? "Closed" : `${hours.open} – ${hours.close}`}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
