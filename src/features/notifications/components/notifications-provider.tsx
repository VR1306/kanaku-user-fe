"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { io } from "socket.io-client";
import { Icon } from "@/components/icons/icon";
import { SOCKET_EVENTS } from "@/constants/notifications";
import { TRANSITION } from "@/constants/motion";
import { cn } from "@/utils/cn";
import { fetchRealtimeToken, fetchUnreadCount } from "../api";
import { notificationSchema, type AppNotification } from "../schemas";
import { NotificationIcon } from "./notification-icon";
import { useRouter } from "next/navigation";

type NotificationsContextValue = {
  unread: number;
  /** Goes up whenever the server reports a change, so lists know to reload. */
  version: number;
  /** Re-reads the unread count (call after you mark something as read). */
  refresh: () => void;
  connected: boolean;
};

const NotificationsContext = createContext<NotificationsContextValue>({
  unread: 0,
  version: 0,
  refresh: () => {},
  connected: false,
});

export const useNotificationsContext = () => useContext(NotificationsContext);

const TOAST_MS = 6000;
const REALTIME_URL = process.env.NEXT_PUBLIC_REALTIME_URL;

/**
 * Keeps the unread count live. Connects to the Socket.IO realtime server (using the session
 * cookie), refreshes the count when anything changes, and pops a toast for new notifications.
 * If the realtime server is unreachable everything still works; the count just updates on
 * navigation and on the Notifications page.
 */
export function NotificationsProvider({
  initialUnread,
  children,
}: {
  initialUnread: number;
  children: ReactNode;
}) {
  const router = useRouter();
  const [unread, setUnread] = useState(initialUnread);
  const [version, setVersion] = useState(0);
  const [connected, setConnected] = useState(false);
  const [toast, setToast] = useState<AppNotification | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const refresh = useCallback(() => {
    fetchUnreadCount()
      .then(({ data }) => setUnread(data.unreadCount))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!REALTIME_URL) return;
    const socket = io(REALTIME_URL, {
      reconnectionDelayMax: 10_000,
      // A fresh short-lived token for every (re)connect, signed by the website.
      auth: (give) => {
        fetchRealtimeToken()
          .then((token) => give({ token }))
          .catch(() => give({ token: "" }));
      },
    });
    socket.on("connect", () => {
      setConnected(true);
      refresh(); // catch up on anything that happened while we were offline
      setVersion((v) => v + 1);
    });
    socket.on("disconnect", () => setConnected(false));
    socket.on(SOCKET_EVENTS.created, (payload: unknown) => {
      const parsed = notificationSchema.safeParse(payload);
      if (parsed.success) {
        setToast(parsed.data);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setToast(null), TOAST_MS);
      }
      refresh();
      setVersion((v) => v + 1);
    });
    socket.on(SOCKET_EVENTS.changed, () => {
      refresh();
      setVersion((v) => v + 1);
    });
    return () => {
      clearTimeout(timer.current);
      socket.disconnect();
    };
  }, [refresh]);

  const value = useMemo(
    () => ({ unread, version, refresh, connected }),
    [unread, version, refresh, connected],
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed top-4 right-4 z-50 w-[min(380px,calc(100vw-2rem))]"
      >
        <AnimatePresence>
          {toast ? (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8 }}
              transition={TRANSITION}
              className="pointer-events-auto flex items-start gap-3 rounded-[18px] border border-line bg-surface p-4 shadow-lg"
            >
              <button
                type="button"
                onClick={() => {
                  setToast(null);
                  router.push(toast.href ?? "/notifications");
                }}
                className="flex min-w-0 flex-1 items-start gap-3 text-left"
              >
                <NotificationIcon kind={toast.kind} size="sm" />
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-ink">{toast.title}</span>
                  <span className="mt-0.5 block text-sm text-muted">{toast.body}</span>
                </span>
              </button>
              <button
                type="button"
                aria-label="Dismiss"
                onClick={() => setToast(null)}
                className={cn(
                  "grid size-7 shrink-0 place-items-center rounded-full text-subtle hover:bg-page hover:text-ink",
                )}
              >
                <Icon name="close" size={14} />
              </button>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </NotificationsContext.Provider>
  );
}
