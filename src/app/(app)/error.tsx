"use client";

import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

export default function AppError({ reset }: { error: Error; reset: () => void }) {
  return (
    <EmptyState
      icon="help"
      title="Something went wrong"
      description="We couldn't load this page. Try again, and if it keeps happening, contact support."
      action={<Button onClick={reset}>Try again</Button>}
    />
  );
}
