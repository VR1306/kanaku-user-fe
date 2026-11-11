"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/services/api-client";
import { fetchBudgets } from "../api";
import type { BudgetsOverview } from "../schemas";

type State = {
  attempt: number;
  data?: BudgetsOverview;
  error?: { message: string; status: number };
};

/** Loads this month's budgets. The previous data stays on screen while a reload is in flight. */
export function useBudgets() {
  const [state, setState] = useState<State | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetchBudgets(controller.signal)
      .then(({ data }) => setState({ attempt, data }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setState((s) => ({
          attempt,
          data: s?.data,
          error: {
            message: error instanceof Error ? error.message : "Couldn't load your budgets.",
            status: error instanceof ApiError ? error.status : 0,
          },
        }));
      });
    return () => controller.abort();
  }, [attempt]);

  const current = state && state.attempt === attempt ? state : null;
  return {
    data: state?.data,
    error: current?.error,
    loading: !current,
    reload: () => setAttempt((a) => a + 1),
  };
}
