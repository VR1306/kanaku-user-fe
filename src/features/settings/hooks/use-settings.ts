"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchSettings } from "../api";
import type { SettingsData } from "../schemas";

/** Loads the account settings. Call `reload` after saving something. */
export function useSettings() {
  const [data, setData] = useState<SettingsData>();
  const [error, setError] = useState<string>();
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetchSettings(controller.signal)
      .then((r) => {
        setData(r.data);
        setError(undefined);
      })
      .catch((e: unknown) => {
        if (!controller.signal.aborted) {
          setError(e instanceof Error ? e.message : "Couldn't load your settings.");
        }
      });
    return () => controller.abort();
  }, [attempt]);

  const reload = useCallback(() => setAttempt((a) => a + 1), []);
  return { data, error, reload };
}
