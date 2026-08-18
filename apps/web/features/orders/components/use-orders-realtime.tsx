"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

const SOUND_KEY = "ordra-order-sound";

let chimeUrl: string | null = null;
let chimeEl: HTMLAudioElement | null = null;

function createOrdersRealtimeClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

function buildChimeWav(): Blob {
  const sampleRate = 22050;
  const duration = 0.55;
  const count = Math.floor(sampleRate * duration);
  const pcm = new Int16Array(count);

  for (let i = 0; i < count; i += 1) {
    const t = i / sampleRate;
    const freq = t < 0.16 ? 880 : 1175;
    const attack = Math.min(1, t / 0.008);
    const decay = Math.exp(-t * 4.2);
    const sample = Math.sin(2 * Math.PI * freq * t) * attack * decay;
    pcm[i] = Math.round(Math.max(-1, Math.min(1, sample)) * 32767);
  }

  const bytes = new Uint8Array(44 + pcm.byteLength);
  const view = new DataView(bytes.buffer);
  const writeAscii = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i += 1) {
      view.setUint8(offset + i, value.charCodeAt(i));
    }
  };

  writeAscii(0, "RIFF");
  view.setUint32(4, 36 + pcm.byteLength, true);
  writeAscii(8, "WAVE");
  writeAscii(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeAscii(36, "data");
  view.setUint32(40, pcm.byteLength, true);
  bytes.set(new Uint8Array(pcm.buffer, pcm.byteOffset, pcm.byteLength), 44);
  return new Blob([bytes], { type: "audio/wav" });
}

function getChimeElement(): HTMLAudioElement {
  if (!chimeUrl) {
    chimeUrl = URL.createObjectURL(buildChimeWav());
  }
  if (!chimeEl) {
    chimeEl = new Audio(chimeUrl);
    chimeEl.preload = "auto";
  }
  // Full tab volume. OS / laptop volume still applies — browsers cannot override it.
  chimeEl.volume = 1;
  return chimeEl;
}

async function playChime(): Promise<boolean> {
  const el = getChimeElement();
  try {
    el.pause();
    el.currentTime = 0;
    el.volume = 1;
    await el.play();
    return true;
  } catch {
    return false;
  }
}

export type OrdersRealtimeState = {
  connection: "connecting" | "live" | "reconnecting";
  soundEnabled: boolean;
  soundError: string | null;
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
  const [soundError, setSoundError] = useState<string | null>(null);
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
    const next = !soundEnabled;
    setSoundEnabled(next);
    try {
      window.localStorage.setItem(SOUND_KEY, next ? "1" : "0");
    } catch {
      // ignore
    }
    if (!next) {
      setSoundError(null);
      return;
    }
    void playChime().then((ok) => {
      setSoundError(
        ok ? null : "Could not play the chime. Unmute this browser tab and try again.",
      );
    });
  }, [soundEnabled]);

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
              void playChime();
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
            void playChime();
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

  return { connection, soundEnabled, soundError, toggleSound };
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
