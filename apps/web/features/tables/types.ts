import type { CafeRole } from "@/features/memberships/types";

export const CAFE_TABLE_STATUSES = ["active", "inactive"] as const;
export type CafeTableStatus = (typeof CAFE_TABLE_STATUSES)[number];

export type CafeTableSection = {
  id: string;
  cafe_id: string;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type CafeTable = {
  id: string;
  cafe_id: string;
  code: string;
  capacity: number;
  status: CafeTableStatus;
  section_id: string | null;
  public_token: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  section?: CafeTableSection | null;
};

export const CAFE_TABLE_SELECT_COLUMNS =
  "id, cafe_id, code, capacity, status, section_id, public_token, sort_order, created_at, updated_at" as const;

export const CAFE_TABLE_SECTION_SELECT_COLUMNS =
  "id, cafe_id, name, sort_order, created_at, updated_at" as const;

/** Owner/manager may create, edit, deactivate, and delete tables/sections. */
export function canManageTables(role: CafeRole): boolean {
  return role === "owner" || role === "manager";
}

/** All members may view tables for ops awareness. */
export function canViewTables(role: CafeRole): boolean {
  return role === "owner" || role === "manager" || role === "staff";
}
