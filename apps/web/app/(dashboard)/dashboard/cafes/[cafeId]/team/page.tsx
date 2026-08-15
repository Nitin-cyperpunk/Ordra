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
import { EmptyState } from "@/components/empty-state";

type TeamPageProps = {
  params: Promise<{ cafeId: string }>;
};

export async function generateMetadata({ params }: TeamPageProps) {
  const { cafeId } = await params;
  const cafe = await getCafeById(cafeId);
  return {
    title: cafe ? `Team · ${cafe.name}` : "Team · Ordra",
    robots: { index: false, follow: false },
  };
}

export default async function CafeTeamPage({ params }: TeamPageProps) {
  const { cafeId } = await params;
  const { role, user } = await requireCafeAccess(cafeId);
  const manage = canManageMembers(role);

  const [members, invitations] = await Promise.all([
    getCafeMemberships(cafeId),
    manage ? getPendingInvitations(cafeId) : Promise.resolve([]),
  ]);

  const solo = members.length <= 1;

  return (
    <main className="mx-auto max-w-lg space-y-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">Team</h2>
        <p className="text-muted-foreground text-sm">
          Invite managers and staff when you’re ready. You can run things solo until then.
        </p>
      </div>

      {solo && manage ? (
        <EmptyState
          title="You’re running this cafe solo for now"
          description="Invite your team when you’re ready — managers can help with menu and tables, staff can view day-to-day info."
        />
      ) : null}

      <section className="space-y-3">
        <h3 className="text-lg font-medium">People</h3>
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

      {manage ? (
        <>
          <InviteMemberForm cafeId={cafeId} actorRole={role} />
          <section className="space-y-3">
            <h3 className="text-lg font-medium">Pending invites</h3>
            <PendingCafeInvites cafeId={cafeId} invitations={invitations} />
          </section>
        </>
      ) : (
        <p className="text-muted-foreground text-sm">
          Only owners and managers can invite or change team members.
        </p>
      )}
    </main>
  );
}
