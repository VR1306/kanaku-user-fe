"use client";

import { useSyncExternalStore } from "react";

let mountedAt = 0;
const subscribe = () => () => {};
const getSnapshot = () => (mountedAt ||= Date.now());

/**
 * Time (ms) when the page first rendered in the browser; 0 during SSR/hydration.
 * Unlike `useNow` it never ticks, so it doesn't re-render consumers every second.
 */
export function useMountTime(): number {
  return useSyncExternalStore(subscribe, getSnapshot, () => 0);
}
