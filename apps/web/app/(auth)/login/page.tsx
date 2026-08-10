import Link from "next/link";

import { LoginForm } from "@/features/auth/components/login-form";

export const metadata = {
  title: "Sign in · Ordra",
};

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="text-muted-foreground text-sm">Access your Ordra workspace.</p>
      </div>
      {params.error === "auth_callback" ? (
        <p className="text-destructive text-center text-sm" role="alert">
          Email verification failed or expired. Try signing in or request a new link by
          signing up again.
        </p>
      ) : null}
      <LoginForm />
      <p className="text-muted-foreground text-center text-xs">
        <Link href="/" className="underline-offset-4 hover:underline">
          Back to home
        </Link>
      </p>
    </div>
  );
}
