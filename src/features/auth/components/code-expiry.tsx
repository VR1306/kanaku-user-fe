"use client";

import { formatCountdown, useNow } from "@/hooks/use-now";

export function CodeExpiry({ expiresAt }: { expiresAt: number }) {
  const now = useNow();
  if (now === 0) return <span>Code expires in 15:00</span>;
  return now >= expiresAt ? (
    <span className="text-danger">Code expired</span>
  ) : (
    <span>Code expires in {formatCountdown(expiresAt - now)}</span>
  );
}
