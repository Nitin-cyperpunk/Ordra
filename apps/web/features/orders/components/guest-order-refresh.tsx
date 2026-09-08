"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/** Polling fallback — guests cannot subscribe to private `orders` rows. */
export function GuestOrderRefresh({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [live, setLive] = useState(true);

  useEffect(() => {
    if (!enabled) return;

    const refresh = () => {
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        setLive(false);
        return;
      }
      setLive(true);
      router.refresh();
    };

    const id = window.setInterval(refresh, 4000);
    const onOnline = () => {
      setLive(true);
      router.refresh();
    };
    const onOffline = () => setLive(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    return () => {
      window.clearInterval(id);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [enabled, router]);

  if (!enabled) return null;

  return (
    <p
      className="text-muted-foreground px-4 pt-3 text-center text-xs"
      role="status"
      aria-live="polite"
    >
      {live ? "Updating automatically…" : "Connection interrupted — reconnecting…"}
    </p>
  );
}
