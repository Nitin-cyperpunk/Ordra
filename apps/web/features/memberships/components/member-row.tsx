"use client";

import { useActionState } from "react";

import {
  removeMemberAction,
  updateMemberRoleAction,
  type MembershipActionState,
} from "@/features/memberships/actions";
import type { CafeRole, Membership } from "@/features/memberships/types";
import { Button } from "@/components/ui/button";

const initialState: MembershipActionState = {};

type MemberRowProps = {
  cafeId: string;
  membership: Membership;
  actorRole: CafeRole;
  currentUserId: string;
};

export function MemberRow({
  cafeId,
  membership,
  actorRole,
  currentUserId,
}: MemberRowProps) {
  const [roleState, roleAction, rolePending] = useActionState(
    updateMemberRoleAction,
    initialState,
  );
  const [removeState, removeAction, removePending] = useActionState(
    removeMemberAction,
    initialState,
  );

  const isOwnerRow = membership.role === "owner";
  const canEdit =
    !isOwnerRow &&
    (actorRole === "owner" || (actorRole === "manager" && membership.role === "staff"));
  const roleOptions =
    actorRole === "owner" ? (["manager", "staff"] as const) : (["staff"] as const);

  return (
    <li className="flex flex-col gap-2 rounded-md border px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium">
          {membership.user_id === currentUserId ? "You" : membership.user_id.slice(0, 8)}
        </p>
        <p className="text-muted-foreground text-xs">Role: {membership.role}</p>
        {roleState.error || removeState.error ? (
          <p className="text-destructive text-xs">
            {roleState.error ?? removeState.error}
          </p>
        ) : null}
        {roleState.success || removeState.success ? (
          <p className="text-muted-foreground text-xs">
            {roleState.success ?? removeState.success}
          </p>
        ) : null}
      </div>

      {canEdit ? (
        <div className="flex flex-wrap items-center gap-2">
          <form action={roleAction} className="flex items-center gap-2">
            <input type="hidden" name="membershipId" value={membership.id} />
            <input type="hidden" name="cafeId" value={cafeId} />
            <select
              name="role"
              defaultValue={membership.role === "owner" ? "staff" : membership.role}
              className="border-input h-8 rounded-md border bg-transparent px-2 text-xs"
              disabled={rolePending}
            >
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
            <Button type="submit" size="sm" variant="outline" disabled={rolePending}>
              Update
            </Button>
          </form>
          <form action={removeAction}>
            <input type="hidden" name="membershipId" value={membership.id} />
            <input type="hidden" name="cafeId" value={cafeId} />
            <Button
              type="submit"
              size="sm"
              variant="destructive"
              disabled={removePending}
            >
              Remove
            </Button>
          </form>
        </div>
      ) : null}
    </li>
  );
}
