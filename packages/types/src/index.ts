/**
 * Shared domain types for Ordra.
 */

export type CafeId = string & { readonly __brand: "CafeId" };
export type UserId = string & { readonly __brand: "UserId" };

/** Multi-tenant resource marker — every tenant-owned entity must include cafeId. */
export interface TenantScoped {
  cafeId: CafeId;
}

/** Cafe tenant root (Module 2). */
export interface Cafe {
  id: CafeId;
  name: string;
  slug: string;
  ownerId: UserId;
  createdAt: string;
  updatedAt: string;
}
