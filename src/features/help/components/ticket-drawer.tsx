"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";
import { FOCUS_FIELD } from "@/constants/styles";
import { usePreferences } from "@/features/settings/components/preferences-provider";
import { cn } from "@/utils/cn";
import { fetchTicket, markTicketRead, replyToTicket, resolveTicket } from "../api";
import { useChatSocket } from "../hooks/use-chat-socket";
import type { TicketDetail } from "../schemas";
import { TicketBadge } from "./tickets-panel";

/** A ticket's conversation, with a reply box. */
export function TicketDrawer({
  id,
  onClose,
  onChanged,
}: {
  id: string | null;
  onClose: () => void;
  onChanged: () => void;
}) {
  return (
    <Drawer open={id !== null} title="Support ticket" onClose={onClose}>
      {id ? <Thread id={id} onChanged={onChanged} /> : null}
    </Drawer>
  );
}

function Thread({ id, onChanged }: { id: string; onChanged: () => void }) {
  const { formatDate } = usePreferences();
  const [ticket, setTicket] = useState<TicketDetail>();
  const [error, setError] = useState<string>();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [agentTyping, setAgentTyping] = useState(false);
  const typingTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const lastTypingSent = useRef(0);
  const bottom = useRef<HTMLLIElement>(null);

  const load = useCallback(
    (signal?: AbortSignal) =>
      fetchTicket(id, signal)
        .then((r) => {
          setTicket(r.data);
          // Opening the conversation marks the agent's messages as read (they see the double tick).
          if (r.data.unread > 0 || r.data.messages.some((m) => m.from === "support" && !m.readAt))
            void markTicketRead(id).catch(() => undefined);
        })
        .catch((e: unknown) => {
          if (!signal?.aborted)
            setError(e instanceof Error ? e.message : "Couldn't load that ticket.");
        }),
    [id],
  );

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const chat = useChatSocket(
    {
      "chat:updated": (p) => {
        if (p.ticketId === `#${id}`) {
          setAgentTyping(false);
          void load();
          onChanged();
        }
      },
      "chat:typing": (p) => {
        if (p.ticketId === `#${id}` && p.who === "agent") {
          setAgentTyping(true);
          clearTimeout(typingTimer.current);
          typingTimer.current = setTimeout(() => setAgentTyping(false), 4000);
        }
      },
    },
    () => void load(), // catch up after any reconnect
  );
  useEffect(() => () => clearTimeout(typingTimer.current), []);
  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [ticket?.messages.length, agentTyping]);

  async function run(action: () => Promise<{ data: TicketDetail }>) {
    setBusy(true);
    setError(undefined);
    try {
      setTicket((await action()).data);
      onChanged();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function send() {
    if (!text.trim()) return;
    if (await run(() => replyToTicket(id, text, null))) setText("");
  }

  if (error && !ticket)
    return (
      <p role="alert" className="mt-8 text-sm text-danger">
        {error}
      </p>
    );
  if (!ticket) return <Skeleton aria-busy="true" className="mt-8 h-64 rounded-2xl" />;

  return (
    <div className="mt-5 flex flex-1 flex-col">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-muted">
            #{ticket.number} · opened {formatDate(ticket.createdAt)}
          </p>
          {ticket.agent ? (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-ink">
              <span
                aria-hidden="true"
                className={`inline-block size-2 rounded-full ${ticket.agent.online ? "bg-success" : "bg-subtle"}`}
              />
              Chatting with <b>{ticket.agent.name}</b>
              <span className="text-muted">· {ticket.agent.online ? "online" : "offline"}</span>
            </p>
          ) : (
            <p className="mt-1 text-sm text-muted">Waiting for an agent to pick this up</p>
          )}
          <h3 className="mt-1 font-display text-xl leading-tight font-bold break-words text-ink">
            {ticket.subject}
          </h3>
        </div>
        <TicketBadge status={ticket.status} />
      </div>

      <ol className="mt-5 flex flex-col gap-3">
        {ticket.messages.map((m) => (
          <li
            key={m.id}
            className={cn("flex", m.from === "user" ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                "max-w-[88%] rounded-2xl px-4 py-3 text-[15px]",
                m.from === "user" ? "bg-brand-tint text-ink" : "bg-page text-ink",
              )}
            >
              <p className="mb-1 text-xs font-bold text-muted">
                {m.from === "user"
                  ? "You"
                  : m.author
                    ? `${m.author} · Kanaku support`
                    : "Kanaku support"}{" "}
                · {formatDate(m.at)}
              </p>
              <p className="break-words whitespace-pre-wrap">{m.text}</p>
              {m.from === "user" ? (
                <p
                  className="mt-1 text-right text-[11px] text-muted"
                  aria-label={m.readAt ? "Read" : m.deliveredAt ? "Delivered" : "Sent"}
                >
                  {m.readAt ? "✓✓ Read" : m.deliveredAt ? "✓✓ Delivered" : "✓ Sent"}
                </p>
              ) : null}
            </div>
          </li>
        ))}
        {agentTyping ? (
          <li className="text-xs text-muted" aria-live="polite">
            Kanaku support is typing…
          </li>
        ) : null}
        <li ref={bottom} aria-hidden="true" />
      </ol>
      {!chat.connected && process.env.NEXT_PUBLIC_CHAT_URL ? (
        <p className="mt-2 text-xs text-muted">Reconnecting to live chat…</p>
      ) : null}

      {ticket.status === "resolved" ? (
        <div
          role="status"
          className="mt-auto rounded-2xl border border-line bg-page px-5 py-4 pt-4 text-[15px] text-muted"
        >
          <p className="font-semibold text-ink">This ticket is resolved</p>
          <p className="mt-1">
            Replies are closed. If you still need help, close this and send a new message from
            &ldquo;Contact support&rdquo;.
          </p>
        </div>
      ) : (
        <div className="mt-auto pt-6">
          {error ? (
            <p role="alert" className="mb-3 text-sm text-danger">
              {error}
            </p>
          ) : null}
          <label htmlFor="ticket-reply" className="mb-2 block text-sm font-semibold text-ink">
            Reply
          </label>
          <textarea
            id="ticket-reply"
            rows={3}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              if (Date.now() - lastTypingSent.current > 2000) {
                lastTypingSent.current = Date.now();
                chat.typing(id);
              }
            }}
            placeholder="Write your reply"
            className={cn(
              "w-full resize-y rounded-control border border-line-strong bg-surface px-4 py-3 text-[15px] text-ink placeholder:text-subtle",
              FOCUS_FIELD,
            )}
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <span />
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="h-11"
                disabled={busy}
                onClick={() => void run(() => resolveTicket(id))}
              >
                Mark resolved
              </Button>
              <Button
                className="h-11"
                loading={busy}
                disabled={!text.trim()}
                onClick={() => void send()}
              >
                Send reply
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
