"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

import { WaitlistModal } from "@/features/waitlist/components/waitlist-modal";
import { Button } from "@/components/ui/button";

export function ComingSoonPage() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="relative min-h-dvh overflow-hidden text-white">
      <div className="absolute inset-0 scale-105 animate-[ordra-bg-zoom_28s_ease-in-out_infinite_alternate]">
        <Image
          src="/coming-soon-bg.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
      </div>
      <div
        className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/55 to-black/80"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.45)_100%)]"
        aria-hidden
      />

      <header className="relative z-10 flex items-center justify-between px-5 py-5 sm:px-8 sm:py-6">
        <Image
          src="/logo.svg"
          alt="Ordra"
          width={36}
          height={36}
          className="opacity-90"
          priority
        />
      </header>

      <main className="relative z-10 flex min-h-[calc(100dvh-5.5rem)] flex-col justify-center px-5 pb-16 sm:px-8 lg:px-16">
        <div className="animate-in fade-in slide-in-from-bottom-2 max-w-xl duration-700">
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Something exceptional is brewing.
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-white/75 sm:text-lg">
            A smarter way to run your cafe.
            <br />
            Simpler operations. Happier customers. Better business.
          </p>
          <Button
            type="button"
            size="lg"
            onClick={() => setModalOpen(true)}
            className="ordra-gradient-btn group mt-8 h-12 border-0 px-6 text-base text-white shadow-xl transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-white/50"
          >
            Want to know more?
            <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
          </Button>
        </div>
      </main>

      <WaitlistModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
