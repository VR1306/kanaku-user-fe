import { renderEmail, type EmailContent } from "./layout";
import { firstName } from "./theme";

/** An absolute link into the app, for buttons in e-mails. */
export function appUrl(path = "/"): string {
  const origin = (process.env.APP_ORIGIN || "http://localhost:3000").split(",")[0].trim();
  return `${origin.replace(/\/$/, "")}${path}`;
}

const supportEmail = () => process.env.SUPPORT_EMAIL || undefined;
const MANAGE = "You can change which emails you get in Settings > Preferences.";

/** The standard e-mail for a notification: its title, its message and a button to open it. */
export function notificationEmail(input: {
  name?: string;
  title: string;
  body: string;
  /** In-app path the button opens (e.g. "/budgets"). */
  href?: string | null;
}): EmailContent {
  return renderEmail({
    subject: input.title,
    preheader: input.body,
    heading: input.title,
    greeting: `Hi ${firstName(input.name)},`,
    paragraphs: [input.body],
    button: { label: "Open Kanaku", url: appUrl(input.href ?? "/notifications") },
    afterParagraphs: [`Every update is also on your Notifications page. ${MANAGE}`],
    supportEmail: supportEmail(),
    reason: "You received this email because of an update on your Kanaku account.",
  });
}

/** The receipt e-mailed after a Pro payment. */
export function purchaseReceiptEmail(input: {
  name?: string;
  planLabel: string;
  amount: string;
  discount?: string;
  coupon?: string;
  method: string;
  endsOn: string;
  paymentId: string;
}): EmailContent {
  return renderEmail({
    subject: `Your Kanaku receipt · ${input.planLabel}`,
    preheader: `We received ${input.amount}. ${input.planLabel} is active until ${input.endsOn}.`,
    heading: "Payment received",
    greeting: `Hi ${firstName(input.name)},`,
    paragraphs: [`Thank you! Your payment went through and your plan is active.`],
    details: [
      { label: "Plan", value: input.planLabel },
      { label: "Amount paid", value: input.amount },
      ...(input.coupon && input.discount
        ? [{ label: `Coupon ${input.coupon}`, value: `−${input.discount}` }]
        : []),
      { label: "Payment method", value: input.method },
      { label: "Active until", value: input.endsOn },
      { label: "Payment ID", value: input.paymentId },
    ],
    button: { label: "View billing history", url: appUrl("/settings?section=billing") },
    afterParagraphs: [
      "Your plan won't renew by itself. We'll remind you a few days before it ends.",
    ],
    supportEmail: supportEmail(),
    reason: "You received this email because of a payment on your Kanaku account.",
  });
}

/** Sent to the support team when a customer opens a ticket. */
export function supportRequestEmail(input: {
  number: number;
  fromName: string;
  fromEmail: string;
  topic: string;
  subject: string;
  message: string;
  hasAttachment: boolean;
}): EmailContent {
  return renderEmail({
    subject: `New support ticket #${input.number}: ${input.subject}`,
    preheader: `${input.fromName} wrote in about ${input.topic}.`,
    heading: `New ticket #${input.number}`,
    greeting: "Hi team,",
    paragraphs: [`${input.fromName} (${input.fromEmail}) opened a support ticket.`],
    details: [
      { label: "Topic", value: input.topic },
      { label: "Subject", value: input.subject },
      ...(input.hasAttachment
        ? [{ label: "Attachment", value: "Screenshot (see the ticket)" }]
        : []),
    ],
    afterParagraphs: [
      input.message.length > 600 ? `${input.message.slice(0, 597)}…` : input.message,
    ],
    reason: "You received this email because you are on the Kanaku support team.",
  });
}
