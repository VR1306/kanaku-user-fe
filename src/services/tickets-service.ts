/**
 * Support conversations. The Admin Portal owns them (agents, SLA, history); this app talks to its
 * server-to-server support API with the signed-in user's id, so a user can only ever see their own
 * conversations. Real-time delivery comes from the realtime service (see features/help/hooks).
 * Ticket ids in this app are the ticket numbers (1042); the admin calls them "#1042".
 */
import type { TicketStatus } from "@/constants/help";
import type {
  AttachmentInput,
  NewTicketInput,
  TicketDetail,
  TicketSummary,
} from "@/features/help/schemas";
import { adminFetch } from "@/lib/admin-api";
import { getDb } from "@/lib/mongo";
import { getPlanName } from "./billing-service";
import { notifySupport } from "./notification-events";

type AdminMessage = {
  id: string;
  from: "user" | "agent" | "system";
  body: string;
  at: string;
  deliveredAt?: string;
  readAt?: string;
  author?: string;
};
type AdminTicket = {
  id: string;
  number: number;
  subject: string;
  topic: string;
  status: "open" | "assigned" | "waiting" | "resolved" | "closed";
  createdAt: string;
  firstResponseAt: string | null;
  resolvedAt: string | null;
  messages: AdminMessage[];
  unread: number;
  agent?: { name: string; online: boolean } | null;
};

const STATUS: Record<AdminTicket["status"], TicketStatus> = {
  open: "open",
  assigned: "open",
  waiting: "pending",
  resolved: "resolved",
  closed: "resolved",
};
const S = "/api/v1/service/support/tickets";
const q = (userId: string) => `userId=${encodeURIComponent(userId)}`;

const toSummary = (t: AdminTicket): TicketSummary => {
  const agentMsgs = t.messages.filter((m) => m.from === "agent");
  return {
    id: String(t.number),
    number: t.number,
    subject: t.subject,
    topic: t.topic,
    status: STATUS[t.status],
    createdAt: t.createdAt,
    updatedAt: t.messages.at(-1)?.at ?? t.createdAt,
    lastSupportReplyAt: agentMsgs.at(-1)?.at ?? null,
    closedAt: t.resolvedAt,
    unread: t.unread,
  };
};
const toDetail = (t: AdminTicket): TicketDetail => ({
  ...toSummary(t),
  messages: t.messages
    .filter((m) => m.from !== "system")
    .map((m) => ({
      id: m.id,
      from: m.from === "user" ? ("user" as const) : ("support" as const),
      text: m.body,
      at: m.at,
      attachment: null,
      deliveredAt: m.deliveredAt ?? null,
      readAt: m.readAt ?? null,
      author: m.from === "agent" ? (m.author ?? null) : null,
    })),
  agent: t.agent ?? null,
});

export async function listTickets(userId: string): Promise<TicketSummary[]> {
  const rows = await adminFetch<AdminTicket[]>(`${S}?${q(userId)}`, { service: true });
  return rows.slice(0, 50).map(toSummary);
}

export async function getTicket(userId: string, id: string): Promise<TicketDetail | null> {
  try {
    const t = await adminFetch<AdminTicket>(`${S}/${encodeURIComponent(id)}?${q(userId)}`, {
      service: true,
    });
    return toDetail(t);
  } catch (e) {
    if ((e as { status?: number }).status === 404) return null;
    throw e;
  }
}

export async function createTicket(userId: string, input: NewTicketInput): Promise<TicketDetail> {
  const user = await (
    await getDb()
  )
    .collection<{ _id: string; name: string }>("users")
    .findOne({ _id: userId });
  const t = await adminFetch<AdminTicket>(S, {
    method: "POST",
    service: true,
    body: {
      userId,
      name: user?.name ?? "Kanaku user",
      plan: (await getPlanName(userId)).toLowerCase(),
      topic: input.topic,
      subject: input.subject,
      message: input.message,
    },
  });
  await notifySupport(userId, {
    key: `ticket-created:${t.id}`,
    title: `Ticket #${t.number} created`,
    body: `“${t.subject}”. We usually reply within a few hours; you'll see replies here instantly.`,
  });
  return toDetail(t);
}

/** The user adds a message. Not allowed once the ticket is resolved (the admin can reopen it). */
/** The ticket is resolved, so the customer can no longer message on it (the admin decides when a ticket reopens). */
export class TicketLockedError extends Error {}

export async function replyToTicket(
  userId: string,
  id: string,
  input: { message: string; attachment: AttachmentInput | null },
): Promise<TicketDetail | null> {
  try {
    const t = await adminFetch<AdminTicket>(`${S}/${encodeURIComponent(id)}/messages`, {
      method: "POST",
      service: true,
      body: { userId, message: input.message },
    });
    return toDetail(t);
  } catch (e) {
    if ((e as { status?: number }).status === 404) return null;
    if ((e as { status?: number }).status === 409)
      throw new TicketLockedError(
        (e as Error).message || "This ticket is resolved, so replies are closed.",
      );
    throw e;
  }
}

export async function resolveTicket(userId: string, id: string): Promise<TicketDetail | null> {
  try {
    const t = await adminFetch<AdminTicket>(`${S}/${encodeURIComponent(id)}/resolve`, {
      method: "POST",
      service: true,
      body: { userId },
    });
    return toDetail(t);
  } catch (e) {
    if ((e as { status?: number }).status === 404) return null;
    throw e;
  }
}

/** The user's client received / opened the agent's messages (drives the ticks the agent sees). */
export async function markSeen(userId: string, id: string, kind: "delivered" | "read") {
  try {
    await adminFetch(`${S}/${encodeURIComponent(id)}/read`, {
      method: "POST",
      service: true,
      body: { userId, kind },
    });
  } catch {
    /* receipts are best-effort */
  }
}

/** Is anyone available for live chat? Never throws: if the Admin Portal can't be reached, say "offline". */
export async function getAvailability() {
  try {
    return await adminFetch<{ online: boolean; count: number; agents: Array<{ name: string }> }>(
      `${S.replace("/tickets", "")}/availability`,
      { service: true },
    );
  } catch {
    return { online: false, count: 0, agents: [] };
  }
}
