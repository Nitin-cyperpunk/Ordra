/**
 * Shared domain types for Ordra.
 * Business entities will be added as modules are implemented.
 */

export type CafeId = string & { readonly __brand: "CafeId" };
export type UserId = string & { readonly __brand: "UserId" };

/** Multi-tenant resource marker — every tenant-owned entity must include cafeId. */
export interface TenantScoped {
  cafeId: CafeId;
}
