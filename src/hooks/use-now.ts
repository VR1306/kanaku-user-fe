"use client";

import { useSyncExternalStore } from "react";

const subscribe = (notify: () => void) => {
  const id = setInterval(notify, 1000);
  return () => clearInterval(id);
};

/** Current time in ms, ticking every second. Returns 0 during SSR/hydration. */
export function useNow(): number {
  return useSyncExternalStore(
    subscribe,
    () => Math.floor(Date.now() / 1000) * 1000,
    () => 0,
  );
}

export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}
