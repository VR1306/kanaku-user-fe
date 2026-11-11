"use client";

import { useCallback, useEffect, useState } from "react";
import type { HelpTopic } from "@/constants/help";
import { fetchArticles, fetchTickets } from "../api";
import type { ArticleSummary, TicketSummary } from "../schemas";

/** Articles matching a search and/or topic. Nothing is fetched while both are empty. */
export function useArticles(query: string, topic?: HelpTopic) {
  const [state, setState] = useState<{ key: string; items: ArticleSummary[] }>();
  const key = `${query}|${topic ?? ""}`;
  const active = query !== "" || topic !== undefined;

  useEffect(() => {
    if (!active) return;
    const controller = new AbortController();
    fetchArticles(query, topic, controller.signal)
      .then((r) => setState({ key, items: r.data.items }))
      .catch(() => undefined);
    return () => controller.abort();
  }, [active, key, query, topic]);

  return {
    items: state?.items ?? [],
    loading: active && state?.key !== key,
    active,
  };
}

/** The signed-in user's tickets. */
export function useTickets() {
  const [tickets, setTickets] = useState<TicketSummary[]>();
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetchTickets(controller.signal)
      .then((r) => setTickets(r.data.items))
      .catch(() => undefined);
    return () => controller.abort();
  }, [attempt]);

  const reload = useCallback(() => setAttempt((a) => a + 1), []);
  return { tickets, loading: tickets === undefined, reload };
}
