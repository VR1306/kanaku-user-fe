"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/services/api-client";
import { fetchRecurring, setRecurringActive } from "../api";
import type { RecurringList } from "../schemas";

type State = { attempt: number; data?: RecurringList; error?: string };

/** Loads the schedules. Previous data stays on screen during a reload; toggles are optimistic. */
export function useRecurring() {
  const [state, setState] = useState<State | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [toggleError, setToggleError] = useState<string>();

  useEffect(() => {
    const controller = new AbortController();
    fetchRecurring(controller.signal)
      .then(({ data }) => setState({ attempt, data }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setState((s) => ({
          attempt,
          data: s?.data,
          error:
            error instanceof ApiError || error instanceof Error
              ? error.message
              : "Couldn't load your recurring payments.",
        }));
      });
    return () => controller.abort();
  }, [attempt]);

  const reload = useCallback(() => setAttempt((a) => a + 1), []);

  const toggle = useCallback(
    async (id: string, active: boolean) => {
      setToggleError(undefined);
      setState((s) =>
        s?.data
          ? {
              ...s,
              data: {
                ...s.data,
                items: s.data.items.map((i) => (i.id === id ? { ...i, active } : i)),
              },
            }
          : s,
      );
      try {
        await setRecurringActive(id, active);
      } catch (e) {
        setToggleError(e instanceof Error ? e.message : "Couldn't update that payment.");
      }
      reload(); // totals, next date and order all change
    },
    [reload],
  );

  const current = state && state.attempt === attempt ? state : null;
  return {
    data: state?.data,
    error: current?.error,
    loading: !current,
    reload,
    toggle,
    toggleError,
  };
}
