"use server";

import { redirect } from "next/navigation";

import { setActiveCafeId } from "@/features/memberships/active-cafe";
import { mapMembershipError } from "@/features/memberships/errors";
import {
  acceptInviteSchema,
  inviteMemberSchema,
  removeMemberSchema,
  setActiveCafeSchema,
  updateMemberRoleSchema,
} from "@/features/memberships/schemas";
import type {
  CafeInvitation,
  CafeMembership,
  CafeRole,
  Membership,
} from "@/features/memberships/types";
import { createClient } from "@/lib/supabase/server";

export type MembershipActionState = {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string[]>;
};

async function requireUser(): Promise<{ id: string; email: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const sub = data?.claims?.sub;
  const email = data?.claims?.email;

  if (error || typeof sub !== "string") {
    redirect("/login");
  }

  return {
    id: sub,
    email: typeof email === "string" ? email : null,
  };
}

export async function getMyCafeMemberships(): Promise<CafeMembership[]> {
  const supabase = await createClient();
  await requireUser();

  const { data, error } = await supabase
    .from("memberships")
    .select(
      "cafe_id, role, cafe:cafes!inner(id, name, slug, owner_id, created_at, updated_at)",
    )
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(mapMembershipError(error));
  }

  return (data ?? []).map((row) => {
    const cafe = Array.isArray(row.cafe) ? row.cafe[0] : row.cafe;
    return {
      cafe_id: row.cafe_id,
      role: row.role as CafeRole,
      cafe: cafe as CafeMembership["cafe"],
    };
  });
}

export async function getCafeMemberships(cafeId: string): Promise<Membership[]> {
  const supabase = await createClient();
  await requireUser();

  const { data, error } = await supabase
    .from("memberships")
    .select("id, user_id, cafe_id, role, created_at, updated_at")
    .eq("cafe_id", cafeId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(mapMembershipError(error));
  }

  return (data ?? []) as Membership[];
}

export async function getMyRoleForCafe(cafeId: string): Promise<CafeRole | null> {
  const supabase = await createClient();
  const user = await requireUser();

  const { data, error } = await supabase
    .from("memberships")
    .select("role")
    .eq("cafe_id", cafeId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(mapMembershipError(error));
  }

  return (data?.role as CafeRole | undefined) ?? null;
}

export async function getPendingInvitations(cafeId: string): Promise<CafeInvitation[]> {
  const supabase = await createClient();
  await requireUser();

  const { data, error } = await supabase
    .from("cafe_invitations")
    .select("id, cafe_id, email, role, invited_by, status, token, created_at, updated_at")
    .eq("cafe_id", cafeId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(mapMembershipError(error));
  }

  return (data ?? []) as CafeInvitation[];
}

export async function getMyPendingInvitations(): Promise<CafeInvitation[]> {
  const supabase = await createClient();
  const user = await requireUser();

  if (!user.email) {
    return [];
  }

  const { data, error } = await supabase
    .from("cafe_invitations")
    .select("id, cafe_id, email, role, invited_by, status, token, created_at, updated_at")
    .eq("status", "pending")
    .ilike("email", user.email)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(mapMembershipError(error));
  }

  return (data ?? []) as CafeInvitation[];
}

export async function inviteMemberAction(
  _prev: MembershipActionState,
  formData: FormData,
): Promise<MembershipActionState> {
  const parsed = inviteMemberSchema.safeParse({
    cafeId: formData.get("cafeId"),
    email: formData.get("email"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return {
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const user = await requireUser();
  const myRole = await getMyRoleForCafe(parsed.data.cafeId);

  if (!myRole || (myRole !== "owner" && myRole !== "manager")) {
    return { error: "You do not have permission to invite members." };
  }

  if (myRole === "manager" && parsed.data.role !== "staff") {
    return { error: "Managers can only invite staff." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("cafe_invitations").insert({
    cafe_id: parsed.data.cafeId,
    email: parsed.data.email.toLowerCase(),
    role: parsed.data.role,
    invited_by: user.id,
    status: "pending",
  });

  if (error) {
    return { error: mapMembershipError(error) };
  }

  return { success: "Invitation created. Share that they should sign in to accept." };
}

export async function updateMemberRoleAction(
  _prev: MembershipActionState,
  formData: FormData,
): Promise<MembershipActionState> {
  const parsed = updateMemberRoleSchema.safeParse({
    membershipId: formData.get("membershipId"),
    cafeId: formData.get("cafeId"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return { error: "Invalid role update request." };
  }

  const myRole = await getMyRoleForCafe(parsed.data.cafeId);
  if (!myRole || (myRole !== "owner" && myRole !== "manager")) {
    return { error: "You do not have permission to change roles." };
  }
  if (myRole === "manager" && parsed.data.role !== "staff") {
    return { error: "Managers can only assign the staff role." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("memberships")
    .update({ role: parsed.data.role })
    .eq("id", parsed.data.membershipId)
    .eq("cafe_id", parsed.data.cafeId)
    .select("id")
    .maybeSingle();

  if (error) {
    return { error: mapMembershipError(error) };
  }
  if (!data) {
    return { error: "Membership not found or cannot be changed." };
  }

  return { success: "Role updated." };
}

export async function removeMemberAction(
  _prev: MembershipActionState,
  formData: FormData,
): Promise<MembershipActionState> {
  const parsed = removeMemberSchema.safeParse({
    membershipId: formData.get("membershipId"),
    cafeId: formData.get("cafeId"),
  });

  if (!parsed.success) {
    return { error: "Invalid remove request." };
  }

  const myRole = await getMyRoleForCafe(parsed.data.cafeId);
  if (!myRole || (myRole !== "owner" && myRole !== "manager")) {
    return { error: "You do not have permission to remove members." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("memberships")
    .delete()
    .eq("id", parsed.data.membershipId)
    .eq("cafe_id", parsed.data.cafeId)
    .select("id")
    .maybeSingle();

  if (error) {
    return { error: mapMembershipError(error) };
  }
  if (!data) {
    return { error: "Membership not found or cannot be removed." };
  }

  return { success: "Member removed." };
}

export async function revokeInvitationAction(
  _prev: MembershipActionState,
  formData: FormData,
): Promise<MembershipActionState> {
  const invitationId = String(formData.get("invitationId") ?? "");
  const cafeId = String(formData.get("cafeId") ?? "");

  if (!invitationId || !cafeId) {
    return { error: "Invalid revoke request." };
  }

  const myRole = await getMyRoleForCafe(cafeId);
  if (!myRole || (myRole !== "owner" && myRole !== "manager")) {
    return { error: "You do not have permission to revoke invites." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("cafe_invitations")
    .update({ status: "revoked" })
    .eq("id", invitationId)
    .eq("cafe_id", cafeId);

  if (error) {
    return { error: mapMembershipError(error) };
  }

  return { success: "Invitation revoked." };
}

export async function acceptInviteAction(
  _prev: MembershipActionState,
  formData: FormData,
): Promise<MembershipActionState> {
  const parsed = acceptInviteSchema.safeParse({
    invitationId: formData.get("invitationId"),
  });

  if (!parsed.success) {
    return { error: "Invalid invitation." };
  }

  const user = await requireUser();
  if (!user.email) {
    return { error: "Your account has no email address." };
  }

  const supabase = await createClient();
  const { data: invite, error: inviteError } = await supabase
    .from("cafe_invitations")
    .select("id, cafe_id, email, role, status")
    .eq("id", parsed.data.invitationId)
    .eq("status", "pending")
    .maybeSingle();

  if (inviteError || !invite) {
    return { error: "Invitation not found." };
  }

  if (invite.email.toLowerCase() !== user.email.toLowerCase()) {
    return { error: "This invitation belongs to a different email address." };
  }

  const { error: memberError } = await supabase.from("memberships").insert({
    user_id: user.id,
    cafe_id: invite.cafe_id,
    role: invite.role,
  });

  if (memberError) {
    return { error: mapMembershipError(memberError) };
  }

  await supabase
    .from("cafe_invitations")
    .update({ status: "accepted" })
    .eq("id", invite.id);

  await setActiveCafeId(invite.cafe_id);
  redirect(`/dashboard/cafes/${invite.cafe_id}`);
}

export async function setActiveCafeAction(
  _prev: MembershipActionState,
  formData: FormData,
): Promise<MembershipActionState> {
  const parsed = setActiveCafeSchema.safeParse({
    cafeId: formData.get("cafeId"),
  });

  if (!parsed.success) {
    return { error: "Invalid cafe." };
  }

  const role = await getMyRoleForCafe(parsed.data.cafeId);
  if (!role) {
    return { error: "You are not a member of that cafe." };
  }

  await setActiveCafeId(parsed.data.cafeId);
  redirect(`/dashboard/cafes/${parsed.data.cafeId}`);
}

/** Persist active cafe from a Client Component (no redirect). */
export async function syncActiveCafeAction(cafeId: string): Promise<void> {
  const parsed = setActiveCafeSchema.safeParse({ cafeId });
  if (!parsed.success) return;

  const role = await getMyRoleForCafe(parsed.data.cafeId);
  if (!role) return;

  await setActiveCafeId(parsed.data.cafeId);
}
