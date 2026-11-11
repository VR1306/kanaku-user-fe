/**
 * Recurring payments backed by MongoDB (collection: recurring). Each schedule is a payment or
 * income that repeats (weekly, monthly, quarterly, yearly). Due occurrences are logged as real
 * transactions by `processDue` (see recurring-runner.ts), so budgets and reports include them.
 * All dates are UTC "YYYY-MM-DD" strings.
 */
import { FREQUENCIES, MAX_CATCH_UP, type Frequency } from "@/constants/recurring";
import type { RecurringInput, RecurringItem, RecurringList } from "@/features/recurring/schemas";
import { getDb } from "@/lib/mongo";
import { randomUUID } from "node:crypto";
import { toneMap } from "./categories-service";
import { logScheduledTransaction } from "./transactions-extra";

type RecurringDoc = {
  _id: string;
  userId: string;
  title: string;
  type: "expense" | "income";
  category: string;
  method: string;
  amount: number;
  frequency: Frequency;
  anchorDay: number;
  nextDue: string;
  active: boolean;
  createdAt: Date;
  lastRunAt?: string;
};

async function recurring() {
  return (await getDb()).collection<RecurringDoc>("recurring");
}

const iso = (d: Date) => d.toISOString().slice(0, 10);
const dayOf = (date: string) => Number(date.slice(8, 10));

/** `months` after `date`, on `anchorDay` (clamped to the month's length). */
function addMonths(date: string, months: number, anchorDay: number): string {
  const y = Number(date.slice(0, 4));
  const m = Number(date.slice(5, 7)) - 1 + months;
  const last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  return iso(new Date(Date.UTC(y, m, Math.min(anchorDay, last))));
}

export function advance(date: string, frequency: Frequency, anchorDay: number): string {
  switch (frequency) {
    case "weekly":
      return iso(new Date(Date.parse(`${date}T12:00:00Z`) + 7 * 86_400_000));
    case "quarterly":
      return addMonths(date, 3, anchorDay);
    case "yearly":
      return addMonths(date, 12, anchorDay);
    default:
      return addMonths(date, 1, anchorDay);
  }
}

const toItem = (d: RecurringDoc, tones: Record<string, RecurringItem["tone"]>): RecurringItem => ({
  id: d._id,
  title: d.title,
  type: d.type,
  category: d.category,
  method: d.method,
  tone: tones[d.category] ?? "slate",
  amount: d.amount,
  frequency: d.frequency,
  anchorDay: d.anchorDay,
  nextDue: d.nextDue,
  active: d.active,
});

const perMonth = (f: Frequency) => FREQUENCIES.find((x) => x.value === f)?.perMonth ?? 1;

export async function listRecurring(userId: string): Promise<RecurringList> {
  const [docs, tones] = await Promise.all([
    recurring().then((c) => c.find({ userId }).toArray()),
    toneMap(userId),
  ]);
  // Active first, soonest payment first; paused ones last.
  docs.sort(
    (a, b) =>
      Number(b.active) - Number(a.active) ||
      a.nextDue.localeCompare(b.nextDue) ||
      a.title.localeCompare(b.title),
  );
  let committed = 0;
  let income = 0;
  let next: RecurringList["summary"]["next"] = null;
  for (const d of docs) {
    if (!d.active) continue;
    const monthly = d.amount * perMonth(d.frequency);
    if (d.type === "income") income += monthly;
    else {
      committed += monthly;
      if (!next || d.nextDue < next.date) next = { title: d.title, date: d.nextDue };
    }
  }
  return {
    currency: "INR",
    items: docs.map((d) => toItem(d, tones)),
    summary: { committed: Math.round(committed), income: Math.round(income), next },
  };
}

export async function createRecurring(userId: string, input: RecurringInput): Promise<string> {
  const id = randomUUID();
  await (
    await recurring()
  ).insertOne({
    _id: id,
    userId,
    title: input.title,
    type: input.type,
    category: input.category,
    method: input.method,
    amount: input.amount,
    frequency: input.frequency,
    anchorDay: dayOf(input.nextDue),
    nextDue: input.nextDue,
    active: true,
    createdAt: new Date(),
  });
  return id;
}

export async function updateRecurring(
  userId: string,
  id: string,
  input: RecurringInput,
): Promise<boolean> {
  const result = await (
    await recurring()
  ).updateOne(
    { _id: id, userId },
    {
      $set: {
        title: input.title,
        type: input.type,
        category: input.category,
        method: input.method,
        amount: input.amount,
        frequency: input.frequency,
        anchorDay: dayOf(input.nextDue),
        nextDue: input.nextDue,
      },
    },
  );
  return result.matchedCount > 0;
}

/** Pausing stops it being logged. Resuming skips any payments missed while it was paused. */
export async function setRecurringActive(
  userId: string,
  id: string,
  active: boolean,
  now = new Date(),
): Promise<boolean> {
  const col = await recurring();
  const doc = await col.findOne({ _id: id, userId });
  if (!doc) return false;
  let nextDue = doc.nextDue;
  if (active) {
    const today = iso(now);
    for (let i = 0; nextDue < today && i < 1000; i++) {
      nextDue = advance(nextDue, doc.frequency, doc.anchorDay);
    }
  }
  await col.updateOne({ _id: id, userId }, { $set: { active, nextDue } });
  return true;
}

export async function deleteRecurring(userId: string, id: string): Promise<boolean> {
  return (await (await recurring()).deleteOne({ _id: id, userId })).deletedCount > 0;
}

export type LoggedPayment = {
  id: string;
  type: "expense" | "income";
  title: string;
  category: string;
  method: string;
  amount: number;
  recurring: true;
  date: string;
};

/** Logs every occurrence that has come due and moves each schedule on. Safe to run repeatedly. */
export async function processDue(userId: string, now = new Date()): Promise<LoggedPayment[]> {
  const col = await recurring();
  const today = iso(now);
  const due = await col.find({ userId, active: true, nextDue: { $lte: today } }).toArray();
  const logged: LoggedPayment[] = [];

  for (const r of due) {
    let next = r.nextDue;
    for (let n = 0; next <= today && n < MAX_CATCH_UP; n++) {
      const id = `rec-${r._id}-${next}`;
      let date = `${next}T12:00:00.000Z`;
      if (Date.parse(date) > now.getTime()) date = new Date(now.getTime() - 60_000).toISOString();
      const created = await logScheduledTransaction(
        userId,
        {
          id,
          title: r.title,
          category: r.category,
          method: r.method,
          type: r.type,
          amount: r.amount,
          date,
        },
        now,
      );
      if (created) {
        logged.push({
          id,
          type: r.type,
          title: r.title,
          category: r.category,
          method: r.method,
          amount: r.amount,
          recurring: true,
          date,
        });
      }
      next = advance(next, r.frequency, r.anchorDay);
    }
    // Anything older than the catch-up limit is skipped rather than logged.
    while (next <= today) next = advance(next, r.frequency, r.anchorDay);
    await col.updateOne(
      { _id: r._id, userId },
      { $set: { nextDue: next, lastRunAt: now.toISOString() } },
    );
  }
  return logged;
}

/** Upcoming expense payments, soonest first. */
export async function upcomingPayments(userId: string, limit: number) {
  const docs = await (
    await recurring()
  )
    .find({ userId, active: true, type: "expense" })
    .sort({ nextDue: 1 })
    .limit(limit)
    .toArray();
  return docs.map((d) => ({
    id: d._id,
    title: d.title,
    method: d.method,
    amount: d.amount,
    nextDue: d.nextDue,
  }));
}

/**
 * Called when a transaction is saved with "repeats every month" ticked: makes sure a monthly
 * schedule exists for it (the next payment is one month after this one).
 */
export async function ensureScheduleFromTransaction(
  userId: string,
  tx: {
    title: string;
    type: "expense" | "income";
    category: string;
    method: string;
    amount: number;
    date: string;
  },
): Promise<void> {
  const col = await recurring();
  const exists = await col.findOne({
    userId,
    title: tx.title,
    type: tx.type,
    category: tx.category,
  });
  if (exists) return;
  const day = tx.date.slice(0, 10);
  await col.insertOne({
    _id: randomUUID(),
    userId,
    title: tx.title,
    type: tx.type,
    category: tx.category,
    method: tx.method,
    amount: Math.abs(tx.amount),
    frequency: "monthly",
    anchorDay: dayOf(day),
    nextDue: addMonths(day, 1, dayOf(day)),
    active: true,
    createdAt: new Date(),
  });
}
