"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Soft refresh fallback when realtime is unavailable for guests. */
export function GuestOrderRefresh({ enabled }: { enabled: boolean }) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled) return;
    const id = window.setInterval(() => {
      router.refresh();
    }, 4000);
    return () => window.clearInterval(id);
  }, [enabled, router]);

  return null;
}
