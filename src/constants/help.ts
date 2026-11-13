import type { IconName } from "./icons";

/** How quickly the support team aims to reply (shown on the Help page and in e-mails). */
export const SUPPORT_REPLY_HOURS = 4;

export const HELP_TOPICS = [
  {
    value: "getting-started",
    label: "Getting started",
    description: "Add your first expense and set a budget",
    icon: "categories",
  },
  {
    value: "budgets",
    label: "Budgets & alerts",
    description: "How limits, rollovers and alerts work",
    icon: "reports",
  },
  {
    value: "billing",
    label: "Billing & plans",
    description: "Payments, invoices, refunds and GST",
    icon: "budgets",
  },
  {
    value: "privacy",
    label: "Privacy & security",
    description: "Two-step login, data export, deletion",
    icon: "shield",
  },
] as const satisfies readonly {
  value: string;
  label: string;
  description: string;
  icon: IconName;
}[];
export type HelpTopic = (typeof HELP_TOPICS)[number]["value"];

/** Topics offered in the contact form: the four above plus "Something else". */
export const CONTACT_TOPICS = [
  ...HELP_TOPICS.map((t) => ({ value: t.value as string, label: t.label as string })),
  { value: "other", label: "Something else" },
];

export const TICKET_STATUSES = ["open", "pending", "resolved"] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number];

export const TICKET_SUBJECT_MAX = 120;
export const TICKET_MESSAGE_MAX = 4000;
/** Files that can be attached to a ticket, by MIME type. Images are shrunk to JPEG first. */
export const ATTACHMENT_TYPES = {
  "image/jpeg": { label: "Image", extensions: [".jpg", ".jpeg", ".png", ".webp", ".gif"] },
  "application/pdf": { label: "PDF", extensions: [".pdf"] },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
    label: "Excel",
    extensions: [".xlsx"],
  },
  "application/vnd.ms-excel": { label: "Excel", extensions: [".xls"] },
  "text/csv": { label: "CSV", extensions: [".csv"] },
} as const;
export type AttachmentType = keyof typeof ATTACHMENT_TYPES;
export const ATTACHMENT_MIME_TYPES = Object.keys(ATTACHMENT_TYPES) as [
  AttachmentType,
  ...AttachmentType[],
];
/** The `accept` value for the file picker. */
export const ATTACHMENT_ACCEPT = "image/*,.pdf,.xlsx,.xls,.csv";
/** Largest file that can be attached (after images are shrunk). */
export const TICKET_ATTACHMENT_MAX_BYTES = 2_000_000;
