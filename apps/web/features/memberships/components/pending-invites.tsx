"use client";

import { useActionState } from "react";

import {
  acceptInviteAction,
  type MembershipActionState,
} from "@/features/memberships/actions";
import type { CafeInvitation } from "@/features/memberships/types";
import { Button } from "@/components/ui/button";

const initialState: MembershipActionState = {};

type PendingInvitesProps = {
  invitations: CafeInvitation[];
};

export function PendingInvitesForUser({ invitations }: PendingInvitesProps) {
  if (invitations.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3 rounded-md border p-4">
      <h2 className="text-sm font-medium">Pending invitations</h2>
      <ul className="space-y-2">
        {invitations.map((invite) => (
          <AcceptInviteRow key={invite.id} invitation={invite} />
        ))}
      </ul>
    </section>
  );
}

function AcceptInviteRow({ invitation }: { invitation: CafeInvitation }) {
  const [state, formAction, pending] = useActionState(acceptInviteAction, initialState);

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 text-sm">
      <span>
        Cafe invite as <strong>{invitation.role}</strong>
      </span>
      <form action={formAction}>
        <input type="hidden" name="invitationId" value={invitation.id} />
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Accepting…" : "Accept"}
        </Button>
      </form>
      {state.error ? (
        <p className="text-destructive w-full text-xs">{state.error}</p>
      ) : null}
    </li>
  );
}
