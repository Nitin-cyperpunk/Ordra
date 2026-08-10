"use client";

import { useEffect } from "react";

import { syncActiveCafeAction } from "@/features/memberships/actions";

/** Writes the active-cafe cookie via a Server Action (allowed from the client). */
export function SyncActiveCafe({ cafeId }: { cafeId: string }) {
  useEffect(() => {
    void syncActiveCafeAction(cafeId);
  }, [cafeId]);

  return null;
}
