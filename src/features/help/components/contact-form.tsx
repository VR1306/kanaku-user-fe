"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Form, FormInput, FormSelect, FormTextarea } from "@/components/ui/form";
import { CONTACT_TOPICS, SUPPORT_REPLY_HOURS } from "@/constants/help";
import { useZodForm } from "@/hooks/use-zod-form";
import { createTicket } from "../api";
import { useAvailability } from "../hooks/use-availability";
import { newTicketFormSchema, type NewTicketFormValues } from "../schemas";

/** "Contact support": topic, subject and message (delivered to the Kanaku support team). Remount it to reset. */
export function ContactForm({
  topic,
  onCreated,
}: {
  topic: string;
  onCreated: (number: number) => void;
}) {
  const form = useZodForm(newTicketFormSchema, { topic, subject: "", message: "" });
  const availability = useAvailability();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "danger"; text: string } | null>(null);

  async function send(values: NewTicketFormValues) {
    setPending(true);
    setMessage(null);
    try {
      const { data } = await createTicket({ ...values, attachment: null });
      form.reset({ topic: values.topic, subject: "", message: "" });
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
      {availability ? (
        <p
          role="status"
          className="mt-3 flex items-center gap-2 text-sm text-muted"
          data-testid="support-availability"
        >
          <span
            aria-hidden="true"
            className={`inline-block size-2.5 rounded-full ${availability.online ? "bg-success" : "bg-subtle"}`}
          />
          {availability.online
            ? `${availability.agents.map((a) => a.name).join(", ")}${availability.count > availability.agents.length ? " and others" : ""} ${availability.count === 1 ? "is" : "are"} online and can chat now`
            : `No agent is online right now. We'll reply within ${SUPPORT_REPLY_HOURS} hours.`}
        </p>
      ) : null}
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
        <span />
        <Button type="submit" loading={pending}>
          Send to support
        </Button>
      </div>
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
