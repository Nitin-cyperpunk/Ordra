import Link from "next/link";

import { getCafeById } from "@/features/cafes/actions";
import { requireCafeAccess } from "@/features/memberships/access";
import { SyncActiveCafe } from "@/features/memberships/components/sync-active-cafe";
import { canEditCafeSettings } from "@/features/memberships/types";
import { Button } from "@/components/ui/button";

type CafeDashboardPageProps = {
  params: Promise<{ cafeId: string }>;
};

export async function generateMetadata({ params }: CafeDashboardPageProps) {
  const { cafeId } = await params;
  const cafe = await getCafeById(cafeId);
  return {
    title: cafe ? `${cafe.name} · Ordra` : "Cafe · Ordra",
    robots: { index: false, follow: false },
  };
}

export default async function CafeDashboardPage({ params }: CafeDashboardPageProps) {
  const { cafeId } = await params;
  const { cafe, role, user } = await requireCafeAccess(cafeId);

  return (
    <main className="mx-auto max-w-lg space-y-8">
      <SyncActiveCafe cafeId={cafeId} />
      <div className="space-y-2">
        <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">
          Cafe workspace
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome to {cafe.name}</h1>
        <p className="text-muted-foreground text-sm">
          Slug: <span className="text-foreground">{cafe.slug}</span>
          {" · "}
          Status: <span className="text-foreground capitalize">{cafe.status}</span>
        </p>
        <p className="text-muted-foreground text-sm">
          User:{" "}
          <span className="text-foreground">{user.email ?? user.id.slice(0, 8)}</span>
        </p>
        <p className="text-muted-foreground text-sm">
          Role: <span className="text-foreground capitalize">{role}</span>
        </p>
        {cafe.description ? (
          <p className="text-muted-foreground whitespace-pre-wrap text-sm">
            {cafe.description}
          </p>
        ) : (
          <p className="text-muted-foreground text-sm">Your cafe workspace is ready.</p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button asChild size="sm">
          <Link href={`/dashboard/cafes/${cafeId}/tables`}>Tables</Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href={`/dashboard/cafes/${cafeId}/menu`}>Menu</Link>
        </Button>
        {canEditCafeSettings(role) ? (
          <Button asChild size="sm" variant="outline">
            <Link href={`/dashboard/cafes/${cafeId}/settings/profile`}>Settings</Link>
          </Button>
        ) : (
          <Button asChild size="sm" variant="outline">
            <Link href={`/dashboard/cafes/${cafeId}/settings/profile`}>View profile</Link>
          </Button>
        )}
        <Button asChild size="sm" variant="outline">
          <Link href={`/dashboard/cafes/${cafeId}/team`}>Team</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard">All cafes</Link>
        </Button>
      </div>
    </main>
  );
}
