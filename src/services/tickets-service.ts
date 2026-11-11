/**
 * Support tickets backed by MongoDB (collections: tickets, counters). A ticket is a conversation
 * between the user and the support team. Status: open = support has it, pending = waiting for
 * the user, resolved = closed. The user replies from the Help page; the support team replies
 * through /api/support/staff/... (see staffReply).
 */
import { TICKET_FIRST_NUMBER, type TicketStatus } from "@/constants/help";
import type {
  AttachmentInput,
  NewTicketInput,
  TicketDetail,
  TicketSummary,
} from "@/features/help/schemas";
import { supportRequestEmail } from "@/lib/email/app-templates";
import { sendBrandedEmail } from "@/lib/email/send";
import { getDb } from "@/lib/mongo";
import { randomUUID } from "node:crypto";
import { notifySupport } from "./notification-events";

type MessageDoc = {
  id: string;
  from: "user" | "support";
  text: string;
  at: Date;
  attachment?: AttachmentInput;
};
type TicketDoc = {
  _id: string;
  number: number;
  userId: string;
  topic: string;
  subject: string;
  status: TicketStatus;
  messages: MessageDoc[];
  createdAt: Date;
  updatedAt: Date;
  lastSupportReplyAt?: Date;
  closedAt?: Date;
};

async function tickets() {
  return (await getDb()).collection<TicketDoc>("tickets");
}

const iso = (d?: Date) => d?.toISOString() ?? null;

const toSummary = (t: TicketDoc): TicketSummary => ({
  id: t._id,
  number: t.number,
  subject: t.subject,
  topic: t.topic,
  status: t.status,
  createdAt: t.createdAt.toISOString(),
  updatedAt: t.updatedAt.toISOString(),
  lastSupportReplyAt: iso(t.lastSupportReplyAt),
  closedAt: iso(t.closedAt),
});

const toDetail = (t: TicketDoc): TicketDetail => ({
  ...toSummary(t),
  messages: t.messages.map((m) => ({
    id: m.id,
    from: m.from,
    text: m.text,
    at: m.at.toISOString(),
    attachment: m.attachment ?? null,
  })),
});

/** Next ticket number, starting at 1041. */
async function nextNumber(): Promise<number> {
  const counters = (await getDb()).collection<{ _id: string; seq: number }>("counters");
  const doc = await counters.findOneAndUpdate(
    { _id: "ticket" },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: "after" },
  );
  // First use creates seq=1; shift so numbering starts at TICKET_FIRST_NUMBER.
  return TICKET_FIRST_NUMBER - 1 + (doc?.seq ?? 1);
}

export async function listTickets(userId: string): Promise<TicketSummary[]> {
  const docs = await (await tickets()).find({ userId }).sort({ updatedAt: -1 }).limit(50).toArray();
  return docs.map(toSummary);
}

export async function getTicket(userId: string, id: string): Promise<TicketDetail | null> {
  const found = await (await tickets()).findOne({ _id: id, userId });
  return found ? toDetail(found) : null;
}

export async function createTicket(userId: string, input: NewTicketInput): Promise<TicketDetail> {
  const now = new Date();
  const doc: TicketDoc = {
    _id: randomUUID(),
    number: await nextNumber(),
    userId,
    topic: input.topic,
    subject: input.subject,
    status: "open",
    messages: [
      {
        id: randomUUID(),
        from: "user",
        text: input.message,
        at: now,
        ...(input.attachment ? { attachment: input.attachment } : {}),
      },
    ],
    createdAt: now,
    updatedAt: now,
  };
  await (await tickets()).insertOne(doc);
  await notifySupport(userId, {
    key: `ticket-created:${doc._id}`,
    title: `Ticket #${doc.number} created`,
    body: `“${doc.subject}”. We usually reply within a few hours; we'll let you know here.`,
  });
  await alertSupportTeam(userId, doc);
  return toDetail(doc);
}

/** E-mails the support team (SUPPORT_EMAIL) about a new ticket. Never throws. */
async function alertSupportTeam(userId: string, doc: TicketDoc) {
  const to = process.env.SUPPORT_EMAIL;
  if (!to) return;
  try {
    const user = await (
      await getDb()
    )
      .collection<{ _id: string; name: string; email: string }>("users")
      .findOne({ _id: userId });
    if (!user) return;
    await sendBrandedEmail(
      to,
      supportRequestEmail({
        number: doc.number,
        fromName: user.name,
        fromEmail: user.email,
        topic: doc.topic,
        subject: doc.subject,
        message: doc.messages[0].text,
        hasAttachment: Boolean(doc.messages[0].attachment),
      }),
    );
  } catch (error) {
    console.error("Couldn't e-mail the support team", error);
  }
}

/** The user adds a message. A pending or resolved ticket goes back to open. */
export async function replyToTicket(
  userId: string,
  id: string,
  input: { message: string; attachment: AttachmentInput | null },
): Promise<TicketDetail | null> {
  const col = await tickets();
  const now = new Date();
  const updated = await col.findOneAndUpdate(
    { _id: id, userId },
    {
      $push: {
        messages: {
          id: randomUUID(),
          from: "user",
          text: input.message,
          at: now,
          ...(input.attachment ? { attachment: input.attachment } : {}),
        },
      },
      $set: { status: "open", updatedAt: now },
      $unset: { closedAt: "" },
    },
    { returnDocument: "after" },
  );
  return updated ? toDetail(updated) : null;
}

export async function resolveTicket(userId: string, id: string): Promise<TicketDetail | null> {
  const now = new Date();
  const updated = await (
    await tickets()
  ).findOneAndUpdate(
    { _id: id, userId },
    { $set: { status: "resolved", updatedAt: now, closedAt: now } },
    { returnDocument: "after" },
  );
  return updated ? toDetail(updated) : null;
}

/**
 * The support team's reply. Sets the status: open (a reply, we're still on it), pending (waiting
 * for the user) or resolved. Tells the user by notification and e-mail. Also
 * tells the user by notification and e-mail.
 */
export async function staffReply(
  number: number,
  input: { message: string; status: "open" | "pending" | "resolved" },
): Promise<boolean> {
  const col = await tickets();
  const now = new Date();
  const updated = await col.findOneAndUpdate(
    { number },
    {
      $push: { messages: { id: randomUUID(), from: "support", text: input.message, at: now } },
      $set: {
        status: input.status,
        updatedAt: now,
        lastSupportReplyAt: now,
        ...(input.status === "resolved" ? { closedAt: now } : {}),
      },
    },
    { returnDocument: "after" },
  );
  if (!updated) return false;
  await notifySupport(updated.userId, {
    key: `ticket-reply:${updated._id}:${now.getTime()}`,
    title:
      input.status === "resolved"
        ? `Ticket #${updated.number} resolved`
        : `Support replied to #${updated.number}`,
    body: input.message.length > 140 ? `${input.message.slice(0, 137)}…` : input.message,
  });
  return true;
}
