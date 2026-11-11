"use client";

import { useCallback, useEffect, useState } from "react";
import type { NotificationFilter } from "@/constants/notifications";
import { ApiError } from "@/services/api-client";
import { fetchNotifications, markAllNotificationsRead, markNotificationRead } from "../api";
import type { NotificationsList } from "../schemas";
import { useNotificationsContext } from "../components/notifications-provider";

type State = { key: string; filter: NotificationFilter; data?: NotificationsList; error?: string };

/**
 * Loads the notification list for a filter. Reloads by itself whenever the realtime server reports
 * a change, and marks items read optimistically.
 */
export function useNotifications(filter: NotificationFilter) {
  const { version, refresh } = useNotificationsContext();
  const [state, setState] = useState<State | null>(null);
  const [attempt, setAttempt] = useState(0);
  const key = `${filter}:${version}:${attempt}`;

  useEffect(() => {
    const controller = new AbortController();
    fetchNotifications(filter, controller.signal)
      .then(({ data }) => setState({ key, filter, data }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setState((s) => ({
          key,
          filter: s?.filter ?? filter,
          data: s?.data,
          error:
            error instanceof ApiError || error instanceof Error
              ? error.message
              : "Couldn't load your notifications.",
        }));
      });
    return () => controller.abort();
  }, [filter, key]);

  const read = useCallback(
    async (id: string) => {
      setState((s) =>
        s?.data
          ? {
              ...s,
              data: {
                unreadCount: Math.max(
                  0,
                  s.data.unreadCount - (s.data.items.find((n) => n.id === id && !n.read) ? 1 : 0),
                ),
                items: s.data.items.map((n) => (n.id === id ? { ...n, read: true } : n)),
              },
            }
          : s,
      );
      await markNotificationRead(id).catch(() => undefined);
      refresh();
    },
    [refresh],
  );

  const readAll = useCallback(async () => {
    setState((s) =>
      s?.data
        ? { ...s, data: { unreadCount: 0, items: s.data.items.map((n) => ({ ...n, read: true })) } }
        : s,
    );
    await markAllNotificationsRead().catch(() => undefined);
    refresh();
  }, [refresh]);

  return {
    data: state?.data,
    /** The filter the loaded data belongs to (lags `filter` while a new tab loads). */
    dataFilter: state?.filter,
    error: state && state.key === key ? state.error : undefined,
    loading: !state || state.key !== key,
    retry: () => setAttempt((a) => a + 1),
    read,
    readAll,
  };
}
