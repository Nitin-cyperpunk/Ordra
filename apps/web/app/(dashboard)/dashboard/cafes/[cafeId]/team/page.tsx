import Link from "next/link";

import { getCafeById } from "@/features/cafes/actions";
import { requireCafeAccess } from "@/features/memberships/access";
import {
  getCafeMemberships,
  getPendingInvitations,
} from "@/features/memberships/actions";
import { InviteMemberForm } from "@/features/memberships/components/invite-member-form";
import { MemberRow } from "@/features/memberships/components/member-row";
import { PendingCafeInvites } from "@/features/memberships/components/pending-cafe-invites";
import { canManageMembers } from "@/features/memberships/types";
import { Button } from "@/components/ui/button";

type TeamPageProps = {
  params: Promise<{ cafeId: string }>;
};

export async function generateMetadata({ params }: TeamPageProps) {
  const { cafeId } = await params;
  const cafe = await getCafeById(cafeId);
  return { title: cafe ? `Team · ${cafe.name}` : "Team · Ordra" };
}

export default async function CafeTeamPage({ params }: TeamPageProps) {
  const { cafeId } = await params;
  const { cafe, role, user } = await requireCafeAccess(cafeId);

  const [members, invitations] = await Promise.all([
    getCafeMemberships(cafeId),
    canManageMembers(role) ? getPendingInvitations(cafeId) : Promise.resolve([]),
  ]);

  return (
    <main className="mx-auto max-w-lg space-y-8">
      <div className="space-y-2">
        <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">
          Cafe settings · Team
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">{cafe.name}</h1>
        <p className="text-muted-foreground text-sm">
          Your role: <span className="text-foreground capitalize">{role}</span>
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Members</h2>
        <ul className="space-y-2">
          {members.map((membership) => (
            <MemberRow
              key={membership.id}
              cafeId={cafeId}
              membership={membership}
              actorRole={role}
              currentUserId={user.id}
            />
          ))}
        </ul>
      </section>

      {canManageMembers(role) ? (
        <>
          <InviteMemberForm cafeId={cafeId} actorRole={role} />
          <section className="space-y-3">
            <h2 className="text-lg font-medium">Pending invites</h2>
            <PendingCafeInvites cafeId={cafeId} invitations={invitations} />
          </section>
        </>
      ) : (
        <p className="text-muted-foreground text-sm">
          Only owners and managers can invite or change team members.
        </p>
      )}

      <div className="flex gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href={`/dashboard/cafes/${cafeId}/settings/profile`}>Cafe settings</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard">All cafes</Link>
        </Button>
      </div>
    </main>
  );
}
