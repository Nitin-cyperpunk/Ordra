import Link from "next/link";
import { redirect } from "next/navigation";

import {
  getMyCafeMemberships,
  getMyPendingInvitations,
} from "@/features/memberships/actions";
import { PendingInvitesForUser } from "@/features/memberships/components/pending-invites";
import { resolveActiveCafe } from "@/features/memberships/active-cafe";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Dashboard · Ordra",
};

export default async function DashboardPage() {
  const [memberships, pendingInvites] = await Promise.all([
    getMyCafeMemberships(),
    getMyPendingInvitations(),
  ]);

  if (memberships.length === 0 && pendingInvites.length === 0) {
    redirect("/onboarding/cafe");
  }

  const active = await resolveActiveCafe();

  return (
    <main className="mx-auto max-w-lg space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Your cafes</h1>
        <p className="text-muted-foreground text-sm">
          Memberships determine which cafes you can access.
          {active ? (
            <>
              {" "}
              Active:{" "}
              <span className="text-foreground">{active.cafeId.slice(0, 8)}…</span>
            </>
          ) : null}
        </p>
      </div>

      <PendingInvitesForUser invitations={pendingInvites} />

      {memberships.length > 0 ? (
        <ul className="space-y-3">
          {memberships.map((item) => (
            <li key={item.cafe_id}>
              <Link
                href={`/dashboard/cafes/${item.cafe_id}`}
                className="hover:bg-accent block rounded-md border px-4 py-3 transition-colors"
              >
                <p className="font-medium">{item.cafe.name}</p>
                <p className="text-muted-foreground text-sm">
                  {item.cafe.slug} · {item.role}
                  {active?.cafeId === item.cafe_id ? " · active" : ""}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground text-sm">
          Accept an invitation above, or create a cafe.
        </p>
      )}

      <Button asChild variant="outline">
        <Link href="/onboarding/cafe">Create another cafe</Link>
      </Button>
    </main>
  );
}
