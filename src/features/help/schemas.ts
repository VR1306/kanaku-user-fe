import { z } from "zod";
import {
  CONTACT_TOPICS,
  HELP_TOPICS,
  ATTACHMENT_MIME_TYPES,
  TICKET_ATTACHMENT_MAX_BYTES,
  TICKET_MESSAGE_MAX,
  TICKET_STATUSES,
  TICKET_SUBJECT_MAX,
} from "@/constants/help";

const helpTopic = z.enum(
  HELP_TOPICS.map((t) => t.value) as ["getting-started", "budgets", "billing", "privacy"],
);

export const articleSummarySchema = z.object({
  slug: z.string(),
  topic: helpTopic,
  title: z.string(),
  summary: z.string(),
});
export const articleSchema = articleSummarySchema.extend({ body: z.array(z.string()) });
export const articlesSchema = z.object({ items: z.array(articleSummarySchema) });
export type ArticleSummary = z.infer<typeof articleSummarySchema>;
export type Article = z.infer<typeof articleSchema>;

export const articlesQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  topic: helpTopic.optional(),
});

const ticketStatus = z.enum(TICKET_STATUSES);

export const ticketSummarySchema = z.object({
  id: z.string(),
  number: z.number().int(),
  subject: z.string(),
  topic: z.string(),
  status: ticketStatus,
  createdAt: z.string(),
  updatedAt: z.string(),
  /** ISO time of the last reply from support, if any. */
  lastSupportReplyAt: z.string().nullable(),
  closedAt: z.string().nullable(),
  /** Agent messages the user hasn't opened yet. */
  unread: z.number().int().min(0).default(0),
});
export type TicketSummary = z.infer<typeof ticketSummarySchema>;

export const ticketMessageSchema = z.object({
  id: z.string(),
  from: z.enum(["user", "support"]),
  text: z.string(),
  at: z.string(),
  attachment: z
    .object({
      name: z.string(),
      type: z.enum(ATTACHMENT_MIME_TYPES),
      size: z.number().int(),
      /** The file itself, as a data URL. */
      dataUrl: z.string(),
    })
    .nullable(),
  /** Receipts: when the other side received / opened it. */
  deliveredAt: z.string().nullable().default(null),
  readAt: z.string().nullable().default(null),
  /** First name of the support agent who wrote it (support messages only). */
  author: z.string().nullable().default(null),
});
export type TicketMessage = z.infer<typeof ticketMessageSchema>;

export const ticketDetailSchema = ticketSummarySchema.extend({
  messages: z.array(ticketMessageSchema),
  /** The support agent handling this ticket (first name) and whether they are online right now. */
  agent: z.object({ name: z.string(), online: z.boolean() }).nullable().default(null),
});
export type TicketDetail = z.infer<typeof ticketDetailSchema>;
export const ticketsSchema = z.object({ items: z.array(ticketSummarySchema) });

/** Roughly how many bytes a base64 string holds. */
const base64Bytes = (b64: string) =>
  Math.floor((b64.length * 3) / 4) - (b64.endsWith("==") ? 2 : b64.endsWith("=") ? 1 : 0);

const attachment = z
  .object({
    name: z.string().trim().min(1).max(120),
    type: z.enum(ATTACHMENT_MIME_TYPES, { message: "That file type isn't supported." }),
    size: z.number().int().positive(),
    dataUrl: z.string(),
  })
  .superRefine((a, ctx) => {
    const match = /^data:([^;,]+);base64,([A-Za-z0-9+/]+={0,2})$/.exec(a.dataUrl);
    if (!match || match[1] !== a.type) {
      ctx.addIssue({ code: "custom", path: ["dataUrl"], message: "That file couldn't be read." });
    } else if (base64Bytes(match[2]) > TICKET_ATTACHMENT_MAX_BYTES) {
      ctx.addIssue({
        code: "custom",
        path: ["dataUrl"],
        message: `Attachments can be up to ${TICKET_ATTACHMENT_MAX_BYTES / 1_000_000} MB.`,
      });
    }
  })
  .nullable();
export type AttachmentInput = NonNullable<z.infer<typeof attachment>>;

const message = z
  .string()
  .trim()
  .min(10, "Tell us a little more (at least 10 characters).")
  .max(TICKET_MESSAGE_MAX, `Keep it under ${TICKET_MESSAGE_MAX} characters.`);

export const newTicketSchema = z.object({
  topic: z.enum(CONTACT_TOPICS.map((t) => t.value) as [string, ...string[]], {
    message: "Choose a topic.",
  }),
  subject: z
    .string()
    .trim()
    .min(3, "Add a short subject.")
    .max(TICKET_SUBJECT_MAX, `Keep it under ${TICKET_SUBJECT_MAX} characters.`),
  message,
  attachment,
});
export type NewTicketInput = z.infer<typeof newTicketSchema>;
/** The contact form keeps the screenshot outside the form fields. */
export const newTicketFormSchema = newTicketSchema.omit({ attachment: true });
export type NewTicketFormValues = z.infer<typeof newTicketFormSchema>;

export const replySchema = z.object({
  message: z.string().trim().min(1, "Write a reply.").max(TICKET_MESSAGE_MAX),
  attachment,
});

/** Used by the support team's tool (see /api/support/staff/...). */
export const staffReplySchema = z.object({
  message: z.string().trim().min(1).max(TICKET_MESSAGE_MAX),
  status: z.enum(["open", "pending", "resolved"]).default("open"),
});

/** Is anyone available for live chat right now? */
export const availabilitySchema = z.object({
  online: z.boolean(),
  count: z.number().int().min(0),
  agents: z.array(z.object({ name: z.string() })),
});
export type SupportAvailability = z.infer<typeof availabilitySchema>;
