"use client";

import { useActionState } from "react";

import {
  revokeInvitationAction,
  type MembershipActionState,
} from "@/features/memberships/actions";
import type { CafeInvitation } from "@/features/memberships/types";
import { Button } from "@/components/ui/button";

const initialState: MembershipActionState = {};

type PendingCafeInvitesProps = {
  cafeId: string;
  invitations: CafeInvitation[];
};

export function PendingCafeInvites({ cafeId, invitations }: PendingCafeInvitesProps) {
  if (invitations.length === 0) {
    return <p className="text-muted-foreground text-sm">No pending invitations.</p>;
  }

  return (
    <ul className="space-y-2">
      {invitations.map((invite) => (
        <RevokeInviteRow key={invite.id} cafeId={cafeId} invitation={invite} />
      ))}
    </ul>
  );
}

function RevokeInviteRow({
  cafeId,
  invitation,
}: {
  cafeId: string;
  invitation: CafeInvitation;
}) {
  const [state, formAction, pending] = useActionState(
    revokeInvitationAction,
    initialState,
  );

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm">
      <span>
        {invitation.email} · {invitation.role}
      </span>
      <form action={formAction}>
        <input type="hidden" name="invitationId" value={invitation.id} />
        <input type="hidden" name="cafeId" value={cafeId} />
        <Button type="submit" size="sm" variant="outline" disabled={pending}>
          Revoke
        </Button>
      </form>
      {state.error ? (
        <p className="text-destructive w-full text-xs">{state.error}</p>
      ) : null}
    </li>
  );
}
