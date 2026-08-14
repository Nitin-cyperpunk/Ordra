"use client";

import {
  useActionState,
  useEffect,
  useId,
  useRef,
  useState,
  startTransition,
} from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";

import {
  joinWaitlistAction,
  type WaitlistActionState,
} from "@/features/waitlist/actions";
import { waitlistSchema, type WaitlistInput } from "@/features/waitlist/schemas";
import { SuccessToast } from "@/features/waitlist/components/success-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type WaitlistModalProps = {
  open: boolean;
  onClose: () => void;
};

const initialState: WaitlistActionState = {};

const fieldClass = cn(
  "h-11 rounded-[10px] border border-white/10 bg-white/[0.04]",
  "text-[15px] text-white shadow-none",
  "placeholder:text-white/35",
  "focus-visible:border-white/25 focus-visible:ring-1 focus-visible:ring-[hsl(var(--ordra-purple)/0.45)]",
  "disabled:opacity-50",
);

export function WaitlistModal({ open, onClose }: WaitlistModalProps) {
  const titleId = useId();
  const descId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const [toastOpen, setToastOpen] = useState(false);
  const [actionState, formAction, pending] = useActionState(
    joinWaitlistAction,
    initialState,
  );

  const form = useForm<WaitlistInput>({
    resolver: zodResolver(waitlistSchema),
    defaultValues: {
      cafeName: "",
      ownerName: "",
      phone: "",
      cafeAddress: "",
      email: "",
    },
  });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      queueMicrotask(() => closeBtnRef.current?.focus());
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    if (!actionState.success) return;
    setToastOpen(true);
    form.reset();
    onClose();
  }, [actionState.success, form, onClose]);

  function onValid(values: WaitlistInput) {
    const fd = new FormData();
    fd.set("cafeName", values.cafeName);
    fd.set("ownerName", values.ownerName);
    fd.set("phone", values.phone);
    fd.set("cafeAddress", values.cafeAddress);
    fd.set("email", values.email);
    fd.set("website", "");
    startTransition(() => {
      formAction(fd);
    });
  }

  return (
    <>
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        aria-describedby={descId}
        className={cn(
          "fixed left-1/2 top-1/2 z-50 m-0 max-h-[90vh] w-[calc(100%-2rem)] max-w-[520px] -translate-x-1/2 -translate-y-1/2 overflow-y-auto",
          "rounded-2xl border border-white/10 bg-[rgba(15,15,18,0.82)] p-0 text-white shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-[20px]",
          "open:animate-in open:fade-in open:slide-in-from-bottom-2 open:zoom-in-[0.98] open:duration-250",
          "[&::backdrop]:bg-black/65 [&::backdrop]:backdrop-blur-[6px]",
        )}
        onClose={() => {
          if (!pending) onClose();
        }}
        onCancel={(event) => {
          if (pending) event.preventDefault();
        }}
      >
        <div className="relative px-6 py-6 sm:px-7 sm:py-7">
          {/* Subtle brand accent — not a full gradient panel */}
          <div
            className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[hsl(var(--ordra-pink)/0.45)] to-transparent sm:inset-x-7"
            aria-hidden
          />

          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 pr-2">
              <h2
                id={titleId}
                className="text-[1.5rem] font-semibold tracking-tight text-white sm:text-[1.65rem]"
              >
                Join the Waitlist
              </h2>
              <p id={descId} className="mt-2 text-sm leading-relaxed text-white/55">
                Be among the first cafes to experience Ordra.
              </p>
            </div>
            <button
              ref={closeBtnRef}
              type="button"
              onClick={() => {
                if (!pending) onClose();
              }}
              disabled={pending}
              className="shrink-0 rounded-lg p-2 text-white/45 transition hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25 disabled:opacity-50"
              aria-label="Close waitlist form"
            >
              <X className="size-4" strokeWidth={1.75} />
            </button>
          </div>

          <form
            className="mt-7 space-y-5"
            onSubmit={form.handleSubmit(onValid)}
            noValidate
          >
            <div
              className="pointer-events-none absolute -left-[9999px] h-0 w-0 overflow-hidden opacity-0"
              aria-hidden
            >
              <label htmlFor="website">Website</label>
              <input id="website" name="website" tabIndex={-1} autoComplete="off" />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                id="cafeName"
                label="Cafe Name"
                error={
                  form.formState.errors.cafeName?.message ??
                  actionState.fieldErrors?.cafeName?.[0]
                }
              >
                <Input
                  id="cafeName"
                  {...form.register("cafeName")}
                  disabled={pending}
                  className={fieldClass}
                  aria-invalid={Boolean(form.formState.errors.cafeName)}
                />
              </Field>

              <Field
                id="ownerName"
                label="Owner Name"
                error={
                  form.formState.errors.ownerName?.message ??
                  actionState.fieldErrors?.ownerName?.[0]
                }
              >
                <Input
                  id="ownerName"
                  {...form.register("ownerName")}
                  disabled={pending}
                  className={fieldClass}
                  aria-invalid={Boolean(form.formState.errors.ownerName)}
                />
              </Field>
            </div>

            <Field
              id="phone"
              label="Phone Number"
              error={
                form.formState.errors.phone?.message ??
                actionState.fieldErrors?.phone?.[0]
              }
            >
              <Input
                id="phone"
                type="tel"
                inputMode="tel"
                placeholder="+91 98765 43210"
                {...form.register("phone")}
                disabled={pending}
                className={fieldClass}
                aria-invalid={Boolean(form.formState.errors.phone)}
              />
            </Field>

            <Field
              id="cafeAddress"
              label="Cafe Address"
              error={
                form.formState.errors.cafeAddress?.message ??
                actionState.fieldErrors?.cafeAddress?.[0]
              }
            >
              <Textarea
                id="cafeAddress"
                rows={2}
                {...form.register("cafeAddress")}
                disabled={pending}
                className={cn(fieldClass, "min-h-[4.5rem] resize-none py-2.5")}
                aria-invalid={Boolean(form.formState.errors.cafeAddress)}
              />
            </Field>

            <Field
              id="email"
              label="Email Address"
              error={
                form.formState.errors.email?.message ??
                actionState.fieldErrors?.email?.[0]
              }
            >
              <Input
                id="email"
                type="email"
                autoComplete="email"
                {...form.register("email")}
                disabled={pending}
                className={fieldClass}
                aria-invalid={Boolean(form.formState.errors.email)}
              />
            </Field>

            {actionState.error && !actionState.success ? (
              <p className="text-sm text-rose-300/90" role="alert">
                {actionState.error}
              </p>
            ) : null}

            <Button
              type="submit"
              disabled={pending}
              className="ordra-gradient-btn mt-1 h-12 w-full rounded-[10px] border-0 text-[15px] font-semibold text-white shadow-none transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-white/30"
            >
              {pending ? "Joining…" : "Join the waitlist"}
            </Button>
          </form>
        </div>
      </dialog>

      <SuccessToast
        open={toastOpen}
        title="You're on the list!"
        description="Thanks for your interest. We'll be in touch soon."
        onClose={() => setToastOpen(false)}
      />
    </>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-[13px] font-medium text-white/70">
        {label}
      </Label>
      {children}
      {error ? (
        <p className="text-[13px] text-rose-300/90" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
