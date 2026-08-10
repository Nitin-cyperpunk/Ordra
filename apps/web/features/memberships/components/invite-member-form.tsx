"use client";

import { useActionState } from "react";

import {
  inviteMemberAction,
  type MembershipActionState,
} from "@/features/memberships/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CafeRole } from "@/features/memberships/types";

const initialState: MembershipActionState = {};

type InviteMemberFormProps = {
  cafeId: string;
  actorRole: CafeRole;
};

export function InviteMemberForm({ cafeId, actorRole }: InviteMemberFormProps) {
  const [state, formAction, pending] = useActionState(inviteMemberAction, initialState);
  const roles =
    actorRole === "owner" ? (["manager", "staff"] as const) : (["staff"] as const);

  return (
    <form action={formAction} className="space-y-3 rounded-md border p-4">
      <input type="hidden" name="cafeId" value={cafeId} />
      <p className="text-sm font-medium">Invite teammate</p>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          disabled={pending}
          placeholder="teammate@cafe.test"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="role">Role</Label>
        <select
          id="role"
          name="role"
          className="border-input flex h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-sm"
          disabled={pending}
          defaultValue={roles[0]}
        >
          {roles.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
      </div>
      {state.error ? (
        <p className="text-destructive text-sm" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="text-muted-foreground text-sm" role="status">
          {state.success}
        </p>
      ) : null}
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Sending…" : "Create invite"}
      </Button>
    </form>
  );
}
