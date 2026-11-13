/**
 * Notifications backed by MongoDB (collection: notifications). Every update worth knowing about
 * lands here: transactions you record, budgets and recurring payments you plan, budget alerts,
 * upcoming bills, monthly reports, purchases, plan reminders and coupon offers. (Purchases,
 * budgets, recurring payments, sign-ins and imports are written by notification-events.ts.)
 * Each one has a dedupe `key`, so the same event never produces two notifications. The realtime
 * server (server/realtime.ts) watches this collection and pushes new ones to the browser.
 */
import { BUDGET_WARN_PERCENT } from "@/constants/budgets";
import {
  BILL_REMINDER_DAYS,
  NOTIFICATIONS_LIMIT,
  type NotificationFilter,
} from "@/constants/notifications";
import { notificationImageUrl } from "@/constants/notification-image";
import { ROUTES, transactionRoute } from "@/constants/routes";
import type { AppNotification, NotificationsList } from "@/features/notifications/schemas";
import { getDb } from "@/lib/mongo";
import { formatCurrency } from "@/utils/format";
import { getBudgets } from "./budgets-service";
import { getPlanEnd } from "./billing-service";
import {
  createNotification,
  notificationsCollection,
  type NotificationDoc,
} from "./notification-store";
import { upcomingPayments } from "./recurring-service";
import { monthTotals } from "./transactions-service";

export { createNotification };

const notifications = notificationsCollection;

const toNotification = (d: NotificationDoc): AppNotification => ({
  id: d._id,
  kind: d.kind,
  title: d.title,
  body: d.body,
  href: d.href,
  createdAt: d.createdAt.toISOString(),
  read: d.read,
  image:
    d.announcementId && d.imageAlt ? { url: notificationImageUrl(d._id), alt: d.imageAlt } : null,
  ctaLabel: d.ctaLabel ?? null,
});

const rupees = (n: number) => formatCurrency(n, "INR");
const shortDate = (d: Date) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).format(d);
const monthName = (d: Date) =>
  new Intl.DateTimeFormat("en-US", { month: "long", timeZone: "UTC" }).format(d);
const monthKey = (d: Date) => d.toISOString().slice(0, 7);
const DAY = 86_400_000;

export async function unreadCount(userId: string): Promise<number> {
  return (await notifications()).countDocuments({ userId, read: false });
}

export async function listNotifications(
  userId: string,
  filter: NotificationFilter,
  now = new Date(),
): Promise<NotificationsList> {
  await syncScheduledNotifications(userId, now);
  const col = await notifications();
  const [docs, unread] = await Promise.all([
    col
      .find({ userId, ...(filter === "unread" ? { read: false } : {}) })
      .sort({ createdAt: -1, _id: 1 })
      .limit(NOTIFICATIONS_LIMIT)
      .toArray(),
    col.countDocuments({ userId, read: false }),
  ]);
  return { items: docs.map(toNotification), unreadCount: unread };
}

export async function markRead(userId: string, id: string): Promise<boolean> {
  const result = await (
    await notifications()
  ).updateOne({ _id: id, userId }, { $set: { read: true } });
  return result.matchedCount > 0;
}

export async function markAllRead(userId: string): Promise<number> {
  const result = await (
    await notifications()
  ).updateMany({ userId, read: false }, { $set: { read: true } });
  return result.modifiedCount;
}

// ---- Events ----

type SavedTransaction = {
  id: string;
  type: "expense" | "income";
  title: string;
  category: string;
  method: string;
  /** Positive. */
  amount: number;
  recurring: boolean;
  /** ISO 8601. */
  date: string;
};

/**
 * Called after a transaction is saved. Never throws: a notification problem must not fail the
 * save itself.
 */
export async function notifyTransactionSaved(
  userId: string,
  tx: SavedTransaction,
  now = new Date(),
  action: "created" | "updated" = "created",
): Promise<void> {
  try {
    const href = transactionRoute(tx.id);
    const updated = action === "updated";
    // An edit is its own event; a new transaction is only reported once.
    const key = (base: string) =>
      updated ? `${base}-updated:${tx.id}:${now.getTime()}` : `${base}:${tx.id}`;
    const detail = `${rupees(tx.amount)} · ${tx.category} · ${tx.method}`;

    if (updated) {
      await createNotification(userId, {
        kind: "transaction",
        key: key("tx"),
        title: `Transaction updated: ${tx.title}`,
        body: `Now ${detail}.`,
        href,
      });
    } else if (tx.type === "income") {
      await createNotification(userId, {
        kind: "income",
        key: key("income"),
        title: `${tx.title} received`,
        body: `${rupees(tx.amount)} was recorded as income on ${shortDate(new Date(tx.date))}.`,
        href,
      });
    } else if (tx.recurring) {
      await createNotification(userId, {
        kind: "bill-paid",
        key: key("paid"),
        title: `${tx.title} paid`,
        body: `${rupees(tx.amount)} recorded under ${tx.category}.`,
        href,
      });
    } else {
      await createNotification(userId, {
        kind: "transaction",
        key: key("tx"),
        title: `Expense recorded: ${tx.title}`,
        body: `${detail}.`,
        href,
      });
    }
    if (tx.type === "income") return;
    // Budget alerts only concern the current month.
    if (monthKey(new Date(tx.date)) === monthKey(now)) await notifyBudget(userId, tx.category, now);
  } catch (error) {
    console.error("Couldn't create notifications", error);
  }
}

async function notifyBudget(userId: string, category: string, now: Date) {
  const overview = await getBudgets(userId, now);
  const budget = overview.items.find((b) => b.category === category);
  if (!budget || budget.limit <= 0) return;
  const month = monthKey(now);
  const href = ROUTES.budgets;
  if (budget.usedPercent > 100) {
    await createNotification(userId, {
      kind: "budget-exceeded",
      key: `budget-exceeded:${category}:${month}`,
      title: `${category} budget exceeded`,
      body: `You've spent ${rupees(budget.spent)} of your ${rupees(budget.limit)} ${category} budget.`,
      href,
    });
  } else if (budget.usedPercent >= BUDGET_WARN_PERCENT) {
    await createNotification(userId, {
      kind: "budget-warning",
      key: `budget-warning:${category}:${month}`,
      title: `${category} at ${budget.usedPercent}%`,
      body: `Only ${rupees(budget.left)} left for the rest of ${monthName(now)}.`,
      href,
    });
  }
}

/** Reminders that depend on the date rather than on an action: upcoming bills, monthly report. */
export async function syncScheduledNotifications(userId: string, now = new Date()): Promise<void> {
  try {
    await Promise.all([
      syncBills(userId, now),
      syncReport(userId, now),
      syncPlan(userId, now),
      syncOffers(userId, now),
    ]);
  } catch (error) {
    console.error("Couldn't sync scheduled notifications", error);
  }
}

async function syncBills(userId: string, now: Date) {
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  for (const bill of await upcomingPayments(userId, 50)) {
    const days = Math.round((Date.parse(`${bill.nextDue}T00:00:00Z`) - today) / DAY);
    if (days < 0 || days > BILL_REMINDER_DAYS) continue;
    const when = days === 0 ? "today" : days === 1 ? "tomorrow" : `in ${days} days`;
    await createNotification(userId, {
      kind: "bill-due",
      key: `bill-due:${bill.id}:${bill.nextDue}`,
      title: `${bill.title} due ${when}`,
      body: `${rupees(bill.amount)} will be charged via ${bill.method} on ${shortDate(new Date(`${bill.nextDue}T12:00:00Z`))}.`,
      href: ROUTES.recurringPayments,
    });
  }
}

async function syncReport(userId: string, now: Date) {
  const previous = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const totals = await monthTotals(userId, now, 1);
  if (totals.expenses === 0 && totals.income === 0) return;
  const saved = totals.income - totals.expenses;
  const rate = totals.income > 0 ? Math.round((saved / totals.income) * 1000) / 10 : 0;
  await createNotification(userId, {
    kind: "report",
    key: `report:${monthKey(previous)}`,
    title: `Your ${monthName(previous)} report is ready`,
    body:
      totals.income > 0 && saved > 0
        ? `You saved ${rate}% of your income. Great work.`
        : `You spent ${rupees(totals.expenses)} in ${monthName(previous)}.`,
    href: ROUTES.reports,
  });
}

/** Reminds the user a few days before their Pro plan runs out (it doesn't renew by itself). */
async function syncPlan(userId: string, now: Date) {
  const end = await getPlanEnd(userId);
  if (!end) return;
  const days = Math.ceil((end.getTime() - now.getTime()) / DAY);
  if (days > BILL_REMINDER_DAYS || days < 0) return;
  const when = days <= 0 ? "today" : days === 1 ? "tomorrow" : `in ${days} days`;
  await createNotification(userId, {
    kind: "plan-ending",
    key: `plan-ending:${end.toISOString().slice(0, 10)}`,
    title: `Your Pro plan ends ${when}`,
    body: `Pro runs until ${shortDate(end)}. Extend it in Settings > Plan & billing to keep your Pro features.`,
    href: `${ROUTES.settings}?section=billing`,
  });
}

/** Tells the user about coupon offers that are live, once each. */
async function syncOffers(userId: string, now: Date) {
  const coupons = await (
    await getDb()
  )
    .collection<{
      _id: string;
      label: string;
      percentOff: number;
      active: boolean;
      expiresAt?: Date;
    }>("coupons")
    .find({ active: true })
    .toArray();
  for (const c of coupons) {
    if (c.expiresAt && c.expiresAt.getTime() < now.getTime()) continue;
    await createNotification(userId, {
      kind: "offer",
      key: `offer:${c._id}`,
      title: `Offer: ${c.percentOff}% off Pro with ${c._id}`,
      body: `${c.label}.${c.expiresAt ? ` Valid until ${shortDate(c.expiresAt)}.` : ""} Enter the code when you upgrade in Settings > Plan & billing.`,
      href: `${ROUTES.settings}?section=billing`,
    });
  }
}
