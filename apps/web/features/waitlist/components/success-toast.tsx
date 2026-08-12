"use client";

import { useEffect } from "react";
import { CheckCircle2, X } from "lucide-react";

import { cn } from "@/lib/utils";

type SuccessToastProps = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  durationMs?: number;
};

export function SuccessToast({
  open,
  title,
  description,
  onClose,
  durationMs = 4500,
}: SuccessToastProps) {
  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(onClose, durationMs);
    return () => window.clearTimeout(timer);
  }, [open, durationMs, onClose]);

  if (!open) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "fixed bottom-6 right-6 z-[70] w-[min(100%-2rem,22rem)]",
        "animate-in fade-in slide-in-from-bottom-3 duration-300",
      )}
    >
      <div className="rounded-xl border border-white/20 bg-black/85 p-4 text-white shadow-2xl backdrop-blur-md">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-400" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{title}</p>
            {description ? (
              <p className="mt-1 text-sm text-white/70">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-white/60 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            aria-label="Dismiss notification"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
