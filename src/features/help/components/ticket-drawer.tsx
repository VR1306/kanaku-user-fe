"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";
import { FOCUS_FIELD } from "@/constants/styles";
import { usePreferences } from "@/features/settings/components/preferences-provider";
import { cn } from "@/utils/cn";
import { ATTACHMENT_ACCEPT } from "@/constants/help";
import { fetchTicket, replyToTicket, resolveTicket } from "../api";
import type { AttachmentInput, TicketDetail } from "../schemas";
import { fileToAttachment } from "../attachment";
import { AttachmentPreview } from "./attachment-preview";
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
  const [shot, setShot] = useState<AttachmentInput | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchTicket(id, controller.signal)
      .then((r) => setTicket(r.data))
      .catch((e: unknown) => {
        if (!controller.signal.aborted)
          setError(e instanceof Error ? e.message : "Couldn't load that ticket.");
      });
    return () => controller.abort();
  }, [id]);

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
    if (await run(() => replyToTicket(id, text, shot))) {
      setText("");
      setShot(null);
    }
  }

  async function attach(file: File | undefined) {
    if (fileRef.current) fileRef.current.value = "";
    if (!file) return;
    try {
      setShot(await fileToAttachment(file));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't attach that image.");
    }
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
                {m.from === "user" ? "You" : "Kanaku support"} · {formatDate(m.at)}
              </p>
              <p className="break-words whitespace-pre-wrap">{m.text}</p>
              {m.attachment ? (
                <AttachmentPreview attachment={m.attachment} className="mt-2" />
              ) : null}
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-auto pt-6">
        {error ? (
          <p role="alert" className="mb-3 text-sm text-danger">
            {error}
          </p>
        ) : null}
        <label htmlFor="ticket-reply" className="mb-2 block text-sm font-semibold text-ink">
          {ticket.status === "resolved" ? "Reopen with a reply" : "Reply"}
        </label>
        <textarea
          id="ticket-reply"
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write your reply"
          className={cn(
            "w-full resize-y rounded-control border border-line-strong bg-surface px-4 py-3 text-[15px] text-ink placeholder:text-subtle",
            FOCUS_FIELD,
          )}
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <input
              ref={fileRef}
              type="file"
              accept={ATTACHMENT_ACCEPT}
              className="sr-only"
              aria-label="Choose a file to attach"
              onChange={(e) => void attach(e.target.files?.[0])}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="text-sm font-semibold text-link hover:underline"
            >
              {shot ? "Change file" : "+ Attach file"}
            </button>
          </div>
          <div className="flex gap-2">
            {ticket.status !== "resolved" ? (
              <Button
                variant="outline"
                className="h-11"
                disabled={busy}
                onClick={() => void run(() => resolveTicket(id))}
              >
                Mark resolved
              </Button>
            ) : null}
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
        {shot ? (
          <AttachmentPreview attachment={shot} onRemove={() => setShot(null)} className="mt-3" />
        ) : null}
      </div>
    </div>
  );
}
