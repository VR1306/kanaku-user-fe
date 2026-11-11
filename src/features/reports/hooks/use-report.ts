"use client";

import { useEffect, useState } from "react";
import type { ReportRange } from "@/constants/reports";
import { ApiError } from "@/services/api-client";
import { fetchReport } from "../api";
import type { ReportData } from "../schemas";

type State = { key: string; data?: ReportData; error?: string };

/** Loads the report for a range. The previous report stays on screen while the next one loads. */
export function useReport(range: ReportRange) {
  const [state, setState] = useState<State | null>(null);
  const [attempt, setAttempt] = useState(0);
  const key = `${range}:${attempt}`;

  useEffect(() => {
    const controller = new AbortController();
    fetchReport(range, controller.signal)
      .then(({ data }) => setState({ key, data }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setState((s) => ({
          key,
          data: s?.data,
          error:
            error instanceof ApiError || error instanceof Error
              ? error.message
              : "Couldn't load your report.",
        }));
      });
    return () => controller.abort();
  }, [range, key]);

  return {
    data: state?.data,
    error: state && state.key === key ? state.error : undefined,
    loading: !state || state.key !== key,
    retry: () => setAttempt((a) => a + 1),
  };
}
