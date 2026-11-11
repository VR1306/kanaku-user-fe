"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/services/api-client";
import { fetchTransactions, type SearchParams } from "../api";
import type { TransactionsPage } from "../schemas";

type State = {
  key: string;
  data?: TransactionsPage;
  error?: { message: string; status: number };
};

/** `params` = null means idle (nothing is fetched). */
type Input = { params: SearchParams | null };

/**
 * Lists/searches transactions. Stale responses are cancelled, and the previous results stay
 * available while the next ones load so the UI doesn't flash empty.
 */
export function useTransactionSearch({ params }: Input) {
  const [state, setState] = useState<State | null>(null);
  const [attempt, setAttempt] = useState(0);
  const json = params === null ? null : JSON.stringify(params);
  const key = json === null ? null : `${json}|${attempt}`;

  useEffect(() => {
    if (json === null || key === null) return;
    const controller = new AbortController();
    fetchTransactions(JSON.parse(json) as SearchParams, controller.signal)
      .then(({ data }) => setState({ key, data }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setState({
          key,
          error: {
            message: error instanceof Error ? error.message : "Search failed. Please try again.",
            status: error instanceof ApiError ? error.status : 0,
          },
        });
      });
    return () => controller.abort();
  }, [json, key]);

  const current = state && state.key === key ? state : null;
  return {
    data: current?.data ?? state?.data,
    error: current?.error,
    loading: params !== null && !current,
    reload: () => setAttempt((a) => a + 1),
  };
}
