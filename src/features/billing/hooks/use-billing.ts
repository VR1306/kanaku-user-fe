"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchBilling } from "../api";
import type { Billing } from "../schemas";

/** Loads plans, prices, the current subscription and invoices from the API. */
export function useBilling() {
  const [data, setData] = useState<Billing>();
  const [error, setError] = useState<string>();
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetchBilling(controller.signal)
      .then((r) => {
        setData(r.data);
        setError(undefined);
      })
      .catch((e: unknown) => {
        if (!controller.signal.aborted) {
          setError(e instanceof Error ? e.message : "Couldn't load your billing details.");
        }
      });
    return () => controller.abort();
  }, [attempt]);

  const reload = useCallback(() => setAttempt((a) => a + 1), []);
  return { data, error, reload };
}
