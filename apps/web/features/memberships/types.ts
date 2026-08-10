export const CAFE_ROLES = ["owner", "manager", "staff"] as const;
export type CafeRole = (typeof CAFE_ROLES)[number];

export const INVITEABLE_ROLES = ["manager", "staff"] as const;
export type InviteableRole = (typeof INVITEABLE_ROLES)[number];

export type Membership = {
  id: string;
  user_id: string;
  cafe_id: string;
  role: CafeRole;
  created_at: string;
  updated_at: string;
};

export type CafeInvitation = {
  id: string;
  cafe_id: string;
  email: string;
  role: InviteableRole;
  invited_by: string;
  status: "pending" | "accepted" | "revoked";
  token: string;
  created_at: string;
  updated_at: string;
};

export type CafeMembership = {
  cafe_id: string;
  role: CafeRole;
  cafe: {
    id: string;
    name: string;
    slug: string;
    owner_id: string;
    created_at: string;
    updated_at: string;
  };
};

export function isCafeRole(value: string): value is CafeRole {
  return (CAFE_ROLES as readonly string[]).includes(value);
}

export function canManageMembers(role: CafeRole): boolean {
  return role === "owner" || role === "manager";
}

export function canEditCafeSettings(role: CafeRole): boolean {
  return role === "owner" || role === "manager";
}
