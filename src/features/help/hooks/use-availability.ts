"use client";

import { useEffect, useState } from "react";
import { fetchAvailability } from "../api";
import type { SupportAvailability } from "../schemas";

const REFRESH_MS = 60_000;

/** Whether a support agent is online for live chat. Refreshed every minute and whenever a chat event arrives. */
export function useAvailability(refreshKey = 0) {
  const [state, setState] = useState<SupportAvailability>();
  useEffect(() => {
    let live = true;
    const load = () =>
      fetchAvailability()
        .then((r) => live && setState(r.data))
        .catch(() => live && setState({ online: false, count: 0, agents: [] }));
    void load();
    const id = setInterval(load, REFRESH_MS);
    return () => {
      live = false;
      clearInterval(id);
    };
  }, [refreshKey]);
  return state;
}
