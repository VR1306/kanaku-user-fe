"use client";

import { useEffect, useState } from "react";
import { fetchImpact } from "../api";
import type { Impact } from "../schemas";

type Input = { type: "expense" | "income"; category: string; amount?: number; excludeId?: string };

/** Budget (or income) impact of a transaction. Pass null to stay idle. Keeps the last answer while refreshing. */
export function useImpact(input: Input | null) {
  const [state, setState] = useState<{ key: string; impact?: Impact; failed?: boolean } | null>(
    null,
  );
  const key = input ? JSON.stringify(input) : null;

  useEffect(() => {
    if (key === null) return;
    const controller = new AbortController();
    fetchImpact(JSON.parse(key) as Input, controller.signal)
      .then(({ data }) => setState({ key, impact: data }))
      .catch(() => {
        if (!controller.signal.aborted) setState((s) => ({ key, impact: s?.impact, failed: true }));
      });
    return () => controller.abort();
  }, [key]);

  return { impact: state?.impact, failed: state?.key === key && state?.failed };
}
