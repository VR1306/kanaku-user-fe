"use client";

import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";

const URL = process.env.NEXT_PUBLIC_CHAT_URL;

export type ChatEvents = {
  /** A conversation of this user changed (agent reply, status change, receipts). */
  "chat:updated"?: (p: { ticketId: string; status: string; unread: number }) => void;
  /** An agent is typing in this conversation. */
  "chat:typing"?: (p: { ticketId: string; who: "agent" | "user" }) => void;
};

/**
 * Connects to the support-chat realtime service. A fresh token is fetched on every (re)connect, and
 * `onResync` fires after each (re)connect so the caller can reload anything missed while offline.
 * If the service is unreachable the UI keeps working (it just doesn't update live).
 */
export function useChatSocket(handlers: ChatEvents, onResync: () => void) {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const latest = useRef({ handlers, onResync });
  useEffect(() => {
    latest.current = { handlers, onResync };
  });

  useEffect(() => {
    if (!URL) return;
    const socket = io(URL, {
      reconnectionDelayMax: 10_000,
      auth: (give) => {
        fetch("/api/realtime/chat-token", { credentials: "same-origin" })
          .then((r) => r.json())
          .then((j: { data?: { token: string } }) => give({ token: j.data?.token ?? "" }))
          .catch(() => give({ token: "" }));
      },
    });
    socketRef.current = socket;
    socket.on("connect", () => {
      setConnected(true);
      latest.current.onResync();
    });
    socket.on("disconnect", () => setConnected(false));
    socket.on("chat:updated", (p) => latest.current.handlers["chat:updated"]?.(p));
    socket.on("chat:typing", (p) => latest.current.handlers["chat:typing"]?.(p));
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  return {
    connected,
    typing: (ticketId: string) => socketRef.current?.emit("typing", { ticketId: `#${ticketId}` }),
  };
}
