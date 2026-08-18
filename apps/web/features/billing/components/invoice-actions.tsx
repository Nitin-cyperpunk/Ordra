"use client";

import { useState } from "react";
import { Download, Printer } from "lucide-react";

import { downloadInvoicePdf } from "@/features/billing/build-invoice-pdf";
import { prefersReducedMotion } from "@/features/billing/invoice-logic";
import type { Invoice } from "@/features/billing/types";
import { Button } from "@/components/ui/button";

type InvoiceActionsProps = {
  invoice: Invoice;
};

export function InvoiceActions({ invoice }: InvoiceActionsProps) {
  const [printLabel, setPrintLabel] = useState("Print");
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [printError, setPrintError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"print" | "download" | null>(null);

  async function handlePrint() {
    setPrintError(null);
    setBusy("print");
    setPrintLabel("Preparing print…");
    const delay = prefersReducedMotion() ? 0 : 180;
    await new Promise((resolve) => window.setTimeout(resolve, delay));
    try {
      window.print();
    } catch {
      setPrintError("Unable to open the print dialog. Please try again.");
    } finally {
      setPrintLabel("Print");
      setBusy(null);
    }
  }

  async function handleDownload() {
    setDownloadError(null);
    setBusy("download");
    try {
      await downloadInvoicePdf(invoice);
    } catch {
      setDownloadError("Unable to download the invoice. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <aside className="invoice-actions space-y-3 print:hidden">
      <h2 className="text-sm font-semibold tracking-tight">Invoice actions</h2>
      <p className="text-muted-foreground text-sm">
        Print a paper copy or download a PDF of this bill.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
        <Button
          type="button"
          className="min-h-11"
          onClick={() => void handlePrint()}
          disabled={busy !== null}
          aria-label="Print invoice"
        >
          <Printer className="size-4" aria-hidden />
          {printLabel}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="min-h-11"
          onClick={() => void handleDownload()}
          disabled={busy !== null}
          aria-label="Download invoice PDF"
        >
          <Download className="size-4" aria-hidden />
          {busy === "download" ? "Preparing PDF…" : "Download PDF"}
        </Button>
      </div>
      {printError ? (
        <p className="text-destructive text-sm" role="alert">
          {printError}
        </p>
      ) : null}
      {downloadError ? (
        <p className="text-destructive text-sm" role="alert">
          {downloadError}
        </p>
      ) : null}
    </aside>
  );
}
