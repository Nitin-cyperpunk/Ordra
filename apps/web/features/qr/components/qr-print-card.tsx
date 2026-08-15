"use client";

import { useEffect, useId, useState } from "react";
import QRCode from "qrcode";
import { Download, Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ORDRA_LOGO = "/logo.svg";

export type QrPrintCardProps = {
  url: string;
  downloadBasename: string;
  /** Accessible label for the QR image */
  label: string;
  cafeName: string;
  cafeLogoUrl?: string | null;
  tableLabel?: string | null;
  /** Short public tagline (e.g. cafe description snippet) */
  tagline?: string | null;
};

function truncateTagline(value: string | null | undefined): string | null {
  if (!value) return null;
  const cleaned = value.replace(/\s+/g, " ").trim();
  if (!cleaned) return null;
  if (cleaned.length <= 72) return cleaned;
  return `${cleaned.slice(0, 69).trimEnd()}…`;
}

/**
 * WYSIWYG printable QR card + download/print actions.
 * Card chrome is always light (print-safe); actions are print:hidden.
 */
export function QrPrintCard({
  url,
  downloadBasename,
  label,
  cafeName,
  cafeLogoUrl,
  tableLabel,
  tagline,
}: QrPrintCardProps) {
  const titleId = useId();
  const [pngDataUrl, setPngDataUrl] = useState<string | null>(null);
  const [svgMarkup, setSvgMarkup] = useState<string | null>(null);
  const [logoFailed, setLogoFailed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displayName = cafeName.trim() || "Cafe";
  const shortTagline = truncateTagline(tagline);
  const showCafeLogo = Boolean(cafeLogoUrl) && !logoFailed;

  useEffect(() => {
    setLogoFailed(false);
  }, [cafeLogoUrl]);

  useEffect(() => {
    let cancelled = false;

    async function generate() {
      try {
        const [png, svg] = await Promise.all([
          QRCode.toDataURL(url, {
            errorCorrectionLevel: "M",
            margin: 2,
            width: 640,
            color: { dark: "#111111", light: "#ffffff" },
          }),
          QRCode.toString(url, {
            type: "svg",
            errorCorrectionLevel: "M",
            margin: 2,
            color: { dark: "#111111", light: "#ffffff" },
          }),
        ]);
        if (cancelled) return;
        setPngDataUrl(png);
        setSvgMarkup(svg);
        setError(null);
      } catch {
        if (!cancelled) {
          setError("Unable to generate QR code.");
        }
      }
    }

    void generate();
    return () => {
      cancelled = true;
    };
  }, [url]);

  function downloadPng() {
    if (!pngDataUrl) return;
    const anchor = document.createElement("a");
    anchor.href = pngDataUrl;
    anchor.download = `${downloadBasename}.png`;
    anchor.click();
  }

  function downloadSvg() {
    if (!svgMarkup) return;
    const blob = new Blob([svgMarkup], { type: "image/svg+xml;charset=utf-8" });
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = `${downloadBasename}.svg`;
    anchor.click();
    URL.revokeObjectURL(objectUrl);
  }

  return (
    <div className="space-y-5">
      <article className="qr-print-card" aria-labelledby={titleId}>
        <h2 id={titleId} className="sr-only">
          {label}
        </h2>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={showCafeLogo ? cafeLogoUrl! : ORDRA_LOGO}
          alt=""
          width={52}
          height={52}
          className={cn(
            "qr-print-card__logo",
            !showCafeLogo && "qr-print-card__logo--mark",
          )}
          onError={() => setLogoFailed(true)}
        />

        <p className="qr-print-card__cafe">{displayName}</p>

        {tableLabel ? <p className="qr-print-card__table">Table {tableLabel}</p> : null}

        <div className="qr-print-card__qr" role="img" aria-label={label}>
          {pngDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={pngDataUrl} alt="" width={640} height={640} />
          ) : error ? (
            <p className="flex h-full items-center justify-center p-4 text-sm text-red-700">
              {error}
            </p>
          ) : (
            <p className="flex h-full items-center justify-center p-4 text-sm text-neutral-500">
              Generating QR…
            </p>
          )}
        </div>

        <p className="qr-print-card__instruction">Scan to view our menu</p>

        {shortTagline ? <p className="qr-print-card__tagline">{shortTagline}</p> : null}

        <p className="qr-print-card__footer">Powered by Ordra</p>
      </article>

      <p className="text-muted-foreground break-all text-center text-xs print:hidden">
        {url}
      </p>

      <div className="flex flex-wrap justify-center gap-2 print:hidden">
        <Button
          type="button"
          variant="outline"
          disabled={!pngDataUrl}
          onClick={downloadPng}
          aria-label={`Download QR code as PNG (${downloadBasename})`}
        >
          <Download className="size-4" aria-hidden />
          Download PNG
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={!svgMarkup}
          onClick={downloadSvg}
          aria-label={`Download QR code as SVG (${downloadBasename})`}
        >
          <Download className="size-4" aria-hidden />
          Download SVG
        </Button>
        <Button
          type="button"
          disabled={!pngDataUrl}
          onClick={() => window.print()}
          aria-label="Print QR card"
        >
          <Printer className="size-4" aria-hidden />
          Print
        </Button>
      </div>
    </div>
  );
}
