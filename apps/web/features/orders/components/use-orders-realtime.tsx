"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

const SOUND_KEY = "ordra-order-sound";

function createOrdersRealtimeClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

function playChime() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.value = 0.04;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
    osc.stop(ctx.currentTime + 0.4);
    window.setTimeout(() => void ctx.close(), 500);
  } catch {
    // Autoplay / AudioContext blocked — ignore.
  }
}

export type OrdersRealtimeState = {
  connection: "connecting" | "live" | "reconnecting";
  soundEnabled: boolean;
  toggleSound: () => void;
};

export function useOrdersRealtime(
  cafeId: string,
  options?: { enableSound?: boolean },
): OrdersRealtimeState {
  const router = useRouter();
  const [connection, setConnection] =
    useState<OrdersRealtimeState["connection"]>("connecting");
  const [soundEnabled, setSoundEnabled] = useState(false);
  const knownPending = useRef<Set<string>>(new Set());
  const primed = useRef(false);

  useEffect(() => {
    if (!options?.enableSound) return;
    try {
      setSoundEnabled(window.localStorage.getItem(SOUND_KEY) === "1");
    } catch {
      setSoundEnabled(false);
    }
  }, [options?.enableSound]);

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(SOUND_KEY, next ? "1" : "0");
      } catch {
        // ignore
      }
      if (next) playChime();
      return next;
    });
  }, []);

  useEffect(() => {
    const supabase = createOrdersRealtimeClient();
    const channel = supabase
      .channel(`orders-ops-${cafeId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `cafe_id=eq.${cafeId}`,
        },
        (payload) => {
          const next = payload.new as { id?: string; status?: string } | null;
          if (
            options?.enableSound &&
            soundEnabled &&
            payload.eventType === "INSERT" &&
            next?.status === "pending" &&
            next.id
          ) {
            if (!knownPending.current.has(next.id)) {
              knownPending.current.add(next.id);
              playChime();
            }
          }
          if (
            options?.enableSound &&
            soundEnabled &&
            payload.eventType === "UPDATE" &&
            next?.status === "pending" &&
            next.id &&
            !knownPending.current.has(next.id)
          ) {
            knownPending.current.add(next.id);
            playChime();
          }
          router.refresh();
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setConnection("live");
          primed.current = true;
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setConnection("reconnecting");
        } else if (status === "CLOSED" && primed.current) {
          setConnection("reconnecting");
        } else {
          setConnection("connecting");
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [cafeId, options?.enableSound, router, soundEnabled]);

  return { connection, soundEnabled, toggleSound };
}

export function OrdersConnectionBanner({
  connection,
}: {
  connection: OrdersRealtimeState["connection"];
}) {
  if (connection === "live") return null;

  return (
    <p
      className="bg-muted text-muted-foreground rounded-lg px-3 py-2 text-xs"
      role="status"
      aria-live="polite"
    >
      {connection === "reconnecting"
        ? "Connection interrupted — reconnecting…"
        : "Connecting to live updates…"}
    </p>
  );
}
