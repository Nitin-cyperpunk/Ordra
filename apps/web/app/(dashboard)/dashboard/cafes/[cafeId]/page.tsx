import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getOwnedCafeById } from "@/features/cafes/actions";
import { UpdateCafeForm } from "@/features/cafes/components/update-cafe-form";
import { getMyRoleForCafe } from "@/features/memberships/actions";
import { SyncActiveCafe } from "@/features/memberships/components/sync-active-cafe";
import { canEditCafeSettings } from "@/features/memberships/types";
import { Button } from "@/components/ui/button";

type CafeDashboardPageProps = {
  params: Promise<{ cafeId: string }>;
};

export async function generateMetadata({ params }: CafeDashboardPageProps) {
  const { cafeId } = await params;
  const cafe = await getOwnedCafeById(cafeId);
  return {
    title: cafe ? `${cafe.name} · Ordra` : "Cafe · Ordra",
  };
}

export default async function CafeDashboardPage({ params }: CafeDashboardPageProps) {
  const { cafeId } = await params;
  const cafe = await getOwnedCafeById(cafeId);

  if (!cafe) {
    notFound();
  }

  const role = await getMyRoleForCafe(cafeId);
  if (!role) {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto max-w-lg space-y-8">
      <SyncActiveCafe cafeId={cafeId} />
      <div className="space-y-2">
        <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">
          Cafe workspace
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">{cafe.name}</h1>
        <p className="text-muted-foreground text-sm">
          Slug: <span className="text-foreground">{cafe.slug}</span> · Role:{" "}
          <span className="text-foreground">{role}</span>
        </p>
        <p className="text-muted-foreground text-sm">
          Placeholder dashboard. Menu, tables, and orders will arrive in later modules.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button asChild size="sm">
          <Link href={`/dashboard/cafes/${cafeId}/team`}>Team</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard">All cafes</Link>
        </Button>
      </div>

      {canEditCafeSettings(role) ? (
        <section className="space-y-4">
          <h2 className="text-lg font-medium">Cafe settings</h2>
          <UpdateCafeForm cafe={cafe} />
        </section>
      ) : (
        <p className="text-muted-foreground text-sm">
          Staff can view this cafe but cannot edit settings.
        </p>
      )}
    </main>
  );
}
