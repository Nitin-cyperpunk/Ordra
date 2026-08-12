import type { Metadata } from "next";

import { ComingSoonPage } from "@/features/waitlist/components/coming-soon-page";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");

export const metadata: Metadata = {
  title: "Ordra — Something Exceptional Is Brewing",
  description: "Ordra is building a smarter way for cafes to operate, serve and grow.",
  openGraph: {
    title: "Ordra — Something Exceptional Is Brewing",
    description: "Ordra is building a smarter way for cafes to operate, serve and grow.",
    type: "website",
    ...(siteUrl ? { url: siteUrl } : {}),
  },
  twitter: {
    card: "summary_large_image",
    title: "Ordra — Something Exceptional Is Brewing",
    description: "Ordra is building a smarter way for cafes to operate, serve and grow.",
  },
  ...(siteUrl
    ? {
        alternates: { canonical: siteUrl },
      }
    : {}),
  robots: { index: true, follow: true },
};

export default function HomePage() {
  return <ComingSoonPage />;
}
