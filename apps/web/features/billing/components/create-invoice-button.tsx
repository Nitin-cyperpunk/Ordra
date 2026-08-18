"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import type { IssueInvoiceResult } from "@/features/billing/actions";
import {
  INVOICE_GENERATION_MIN_MS,
  INVOICE_GENERATION_REDUCED_MS,
  INVOICE_GENERATION_STEPS,
  formatInvoiceMoney,
  prefersReducedMotion,
} from "@/features/billing/invoice-logic";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type InvoicePreviewLine = {
  id: string;
  name: string;
  quantity: number;
  unit_price: string;
  line_total: string;
};

type CreateInvoiceButtonProps = {
  cafeName: string;
  currency: string;
  total: string;
  items: InvoicePreviewLine[];
  issue: () => Promise<IssueInvoiceResult>;
  getSuccessHref: (invoiceId: string) => string;
};

const STEP_AT_MS = [0, 280, 620, 980, 1280];

export function CreateInvoiceButton({
  cafeName,
  currency,
  total,
  items,
  issue,
  getSuccessHref,
}: CreateInvoiceButtonProps) {
  const router = useRouter();
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState<string | null>(null);
  const [displayTotal, setDisplayTotal] = useState(total);
  const closeRef = useRef<HTMLButtonElement>(null);
  const issueRef = useRef(issue);
  const hrefRef = useRef(getSuccessHref);
  issueRef.current = issue;
  hrefRef.current = getSuccessHref;

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    const reduced = prefersReducedMotion();
    const minDuration = reduced
      ? INVOICE_GENERATION_REDUCED_MS
      : INVOICE_GENERATION_MIN_MS;
    const started = performance.now();
    const timers: number[] = [];

    if (reduced) {
      setStep(INVOICE_GENERATION_STEPS.length - 1);
      setDisplayTotal(total);
    } else {
      STEP_AT_MS.forEach((ms, index) => {
        timers.push(
          window.setTimeout(() => {
            if (!cancelled) setStep(index);
          }, ms),
        );
      });

      const target = Number.parseFloat(total);
      if (Number.isFinite(target)) {
        const duration = 420;
        const begin = 980;
        const tick = (now: number) => {
          if (cancelled) return;
          const elapsed = now - started - begin;
          if (elapsed < 0) {
            requestAnimationFrame(tick);
            return;
          }
          const progress = Math.min(1, elapsed / duration);
          setDisplayTotal((target * progress).toFixed(2));
          if (progress < 1) requestAnimationFrame(tick);
          else setDisplayTotal(total);
        };
        requestAnimationFrame(tick);
      }
    }

    void (async () => {
      const result = await issueRef.current();
      const wait = Math.max(0, minDuration - (performance.now() - started));
      await new Promise((resolve) => window.setTimeout(resolve, wait));
      if (cancelled) return;

      if (!result.ok) {
        setError(result.error);
        setStep(INVOICE_GENERATION_STEPS.length - 1);
        window.setTimeout(() => closeRef.current?.focus(), 30);
        return;
      }

      setInvoiceNumber(result.invoiceNumber);
      setStep(INVOICE_GENERATION_STEPS.length - 1);
      router.push(hrefRef.current(result.invoiceId));
    })();

    return () => {
      cancelled = true;
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [open, router, total]);

  function start() {
    setError(null);
    setInvoiceNumber(null);
    setDisplayTotal(prefersReducedMotion() ? total : "0.00");
    setStep(0);
    setOpen(true);
  }

  function close() {
    setOpen(false);
    setError(null);
  }

  return (
    <>
      <Button
        type="button"
        className="min-h-11"
        onClick={start}
        aria-label="Create invoice"
      >
        Create Invoice
      </Button>

      {open ? (
        <div
          className="invoice-gen-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
        >
          <div className="invoice-gen-overlay__panel">
            <p id={titleId} className="invoice-gen-overlay__status" aria-live="polite">
              {error ? error : INVOICE_GENERATION_STEPS[step]}
            </p>

            <div className="invoice-slot">
              <article
                className={cn(
                  "invoice-sheet invoice-sheet--compact",
                  !error && "invoice-sheet--enter",
                )}
              >
                <p className="invoice-sheet__brand">Ordra</p>
                <h3 className="invoice-sheet__cafe">{cafeName}</h3>
                <p className="invoice-sheet__meta tabular-nums">
                  {invoiceNumber ?? "INV-····-······"}
                </p>

                <ul className="invoice-sheet__preview-items">
                  {items.map((item, index) => (
                    <li
                      key={item.id}
                      className={cn(
                        "invoice-sheet__preview-row",
                        step >= 2 && "invoice-line--enter",
                      )}
                      style={{ animationDelay: `${Math.min(index, 6) * 40}ms` }}
                    >
                      <span>
                        {item.name}
                        <span className="invoice-sheet__qty"> × {item.quantity}</span>
                      </span>
                      <span className="tabular-nums">
                        {formatInvoiceMoney(item.line_total, currency)}
                      </span>
                    </li>
                  ))}
                </ul>

                <div
                  className={cn(
                    "invoice-sheet__preview-total",
                    step >= 3 && "invoice-line--enter",
                  )}
                >
                  <span>Total</span>
                  <span className="tabular-nums">
                    {formatInvoiceMoney(step >= 3 ? displayTotal : "0.00", currency)}
                  </span>
                </div>

                {step >= 4 && !error ? (
                  <p className="invoice-ready-mark" role="status">
                    Print ready ✓
                  </p>
                ) : null}
              </article>
            </div>

            {error ? (
              <Button
                ref={closeRef}
                type="button"
                variant="outline"
                className="min-h-11"
                onClick={close}
              >
                Close
              </Button>
            ) : (
              <p className="sr-only">Invoice is being prepared.</p>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
