import { z } from "zod";

import { INVITEABLE_ROLES } from "@/features/memberships/types";

export const inviteMemberSchema = z.object({
  cafeId: z.string().uuid(),
  email: z.string().trim().email("Enter a valid email address.").max(255),
  role: z.enum(INVITEABLE_ROLES),
});

export const updateMemberRoleSchema = z.object({
  membershipId: z.string().uuid(),
  cafeId: z.string().uuid(),
  role: z.enum(INVITEABLE_ROLES),
});

export const removeMemberSchema = z.object({
  membershipId: z.string().uuid(),
  cafeId: z.string().uuid(),
});

export const acceptInviteSchema = z.object({
  invitationId: z.string().uuid(),
});

export const setActiveCafeSchema = z.object({
  cafeId: z.string().uuid(),
});
