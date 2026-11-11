"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/services/api-client";
import { fetchTransaction } from "../api";
import type { TransactionDetail } from "../schemas";

type State = { id: string; data?: TransactionDetail; error?: { message: string; status: number } };

/** Loads one transaction. `loading` is true until the response for the current `id` arrives. */
export function useTransaction(id: string | null) {
  const [state, setState] = useState<State | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (id === null) return;
    const controller = new AbortController();
    fetchTransaction(id, controller.signal)
      .then(({ data }) => setState({ id, data }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setState({
          id,
          error: {
            message: error instanceof Error ? error.message : "Couldn't load this transaction.",
            status: error instanceof ApiError ? error.status : 0,
          },
        });
      });
    return () => controller.abort();
  }, [id, attempt]);

  const current = state && state.id === id ? state : null;
  return {
    data: current?.data,
    error: current?.error,
    loading: id !== null && !current,
    reload: () => setAttempt((a) => a + 1),
  };
}
