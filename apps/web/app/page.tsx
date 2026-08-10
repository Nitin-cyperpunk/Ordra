import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <p className="text-muted-foreground text-sm uppercase tracking-[0.2em]">Ordra</p>
      <h1 className="mt-4 max-w-xl text-center text-3xl font-semibold tracking-tight sm:text-4xl">
        Intelligent operations for modern cafes.
      </h1>
      <p className="text-muted-foreground mt-4 max-w-md text-center">
        Sign in to access your workspace. Cafe operations modules come next.
      </p>
      <div className="mt-8 flex gap-3">
        <Button asChild>
          <Link href="/login">Sign in</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/signup">Create account</Link>
        </Button>
      </div>
    </main>
  );
}
