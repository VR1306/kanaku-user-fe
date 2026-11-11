"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/services/api-client";
import { fetchDashboard } from "../api";
import type { DashboardData, DashboardMeta } from "../schemas";

type Result = {
  key: string;
  data?: DashboardData;
  meta?: DashboardMeta;
  error?: { message: string; status: number };
};

/**
 * Loads the dashboard for `month` from the BFF. While a new month loads, the previous data stays
 * available (`data`) so the UI can dim it instead of flashing a skeleton.
 */
export function useDashboard(month: string | null) {
  const [result, setResult] = useState<Result | null>(null);
  const [attempt, setAttempt] = useState(0);
  const key = month ? `${month}:${attempt}` : null;

  useEffect(() => {
    if (!month || !key) return;
    const controller = new AbortController();
    fetchDashboard(month, controller.signal)
      .then(({ data, meta }) => setResult({ key, data, meta }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        const status = error instanceof ApiError ? error.status : 0;
        const message =
          error instanceof Error ? error.message : "Something went wrong. Please try again.";
        setResult({ key, error: { message, status } });
      });
    return () => controller.abort();
  }, [month, key]);

  const current = result && result.key === key ? result : null;
  return {
    data: current?.data ?? result?.data,
    meta: current?.meta ?? result?.meta,
    error: current?.error,
    loading: Boolean(month) && !current,
    retry: () => setAttempt((a) => a + 1),
  };
}
