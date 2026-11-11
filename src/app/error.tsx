"use client";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";

export default function RootError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <Logo tone="light" />
      <div>
        <h1 className="font-display text-3xl font-bold text-ink">Something went wrong</h1>
        <p className="mt-2 text-base text-muted">An unexpected error occurred. Please try again.</p>
      </div>
      <Button size="lg" onClick={reset}>
        Try again
      </Button>
    </main>
  );
}
