"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Form, FormInput, FormSelect, FormTextarea } from "@/components/ui/form";
import { ATTACHMENT_ACCEPT, CONTACT_TOPICS, SUPPORT_REPLY_HOURS } from "@/constants/help";
import { useZodForm } from "@/hooks/use-zod-form";
import { createTicket } from "../api";
import { newTicketFormSchema, type NewTicketFormValues } from "../schemas";
import { fileToAttachment } from "../attachment";
import type { AttachmentInput } from "../schemas";
import { AttachmentPreview } from "./attachment-preview";

/** "Contact support": topic, subject, message and an optional screenshot. Remount it to reset. */
export function ContactForm({
  topic,
  onCreated,
}: {
  topic: string;
  onCreated: (number: number) => void;
}) {
  const form = useZodForm(newTicketFormSchema, { topic, subject: "", message: "" });
  const fileRef = useRef<HTMLInputElement>(null);
  const [attachment, setAttachment] = useState<AttachmentInput | null>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "danger"; text: string } | null>(null);

  async function pick(file: File | undefined) {
    if (fileRef.current) fileRef.current.value = "";
    if (!file) return;
    setMessage(null);
    try {
      setAttachment(await fileToAttachment(file));
    } catch (e) {
      setMessage({
        tone: "danger",
        text: e instanceof Error ? e.message : "Couldn't attach that image.",
      });
    }
  }

  async function send(values: NewTicketFormValues) {
    setPending(true);
    setMessage(null);
    try {
      const { data } = await createTicket({ ...values, attachment });
      form.reset({ topic: values.topic, subject: "", message: "" });
      setAttachment(null);
      setMessage({
        tone: "success",
        text: `Ticket #${data.number} created. We usually reply within ${SUPPORT_REPLY_HOURS} hours.`,
      });
      onCreated(data.number);
    } catch (e) {
      setMessage({
        tone: "danger",
        text: e instanceof Error ? e.message : "Couldn't send that. Please try again.",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <Form
      form={form}
      onSubmit={send}
      className="rounded-[24px] border border-line bg-surface p-6 sm:p-[29px]"
    >
      <h2 className="font-display text-xl font-bold text-ink">Contact support</h2>
      <div className="mt-5 grid grid-cols-[minmax(0,1fr)] gap-5 sm:grid-cols-[repeat(2,minmax(0,1fr))]">
        <FormSelect
          name="topic"
          label="Topic"
          options={CONTACT_TOPICS.map((t) => ({ value: t.value, label: t.label }))}
        />
        <FormInput
          name="subject"
          label="Subject"
          placeholder="e.g. Wrong GST number"
          autoComplete="off"
        />
      </div>
      <div className="mt-5">
        <FormTextarea
          name="message"
          label="Message"
          rows={4}
          placeholder="Tell us what happened and what you expected"
        />
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <input
            ref={fileRef}
            type="file"
            accept={ATTACHMENT_ACCEPT}
            className="sr-only"
            aria-label="Choose a file to attach"
            onChange={(e) => void pick(e.target.files?.[0])}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="h-12 rounded-[12px] border border-dashed border-line-strong bg-page px-5 text-base font-semibold text-link transition-colors hover:bg-line-soft"
          >
            + Attach file
          </button>
        </div>
        <Button type="submit" loading={pending}>
          Send to support
        </Button>
      </div>
      <p className="mt-2 text-xs text-muted">Images, PDF, Excel or CSV, up to 2 MB.</p>
      {attachment ? (
        <AttachmentPreview
          attachment={attachment}
          onRemove={() => setAttachment(null)}
          className="mt-4"
        />
      ) : null}

      {message ? (
        <p
          role={message.tone === "danger" ? "alert" : "status"}
          className={
            message.tone === "success"
              ? "mt-4 rounded-control bg-success-tint px-4 py-3 text-sm font-semibold text-success"
              : "mt-4 rounded-control bg-danger-tint px-4 py-3 text-sm text-danger"
          }
        >
          {message.text}
        </p>
      ) : null}
    </Form>
  );
}
