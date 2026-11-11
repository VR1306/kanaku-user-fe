/**
 * Transactions backed by MongoDB (collection: transactions). Every function is scoped to a user id.
 * Dates are stored as ISO-8601 UTC strings (they sort correctly as text). `search` is a lowercased
 * haystack (title, category, payment, note, amount, month name) used by the search box.
 */
import { SEARCH_MAX_LENGTH, TRANSACTIONS_PAGE_SIZE } from "@/constants/search";
import { searchTerms } from "@/features/transactions/terms";
import type {
  Transaction,
  TransactionDetail,
  TransactionInput,
  TransactionsPage,
  TransactionsQuery,
} from "@/features/transactions/schemas";
import { getDb } from "@/lib/mongo";
import { formatCurrency } from "@/utils/format";
import { toneMap } from "./categories-service";
import { randomUUID } from "node:crypto";
import type { Filter } from "mongodb";

const CURRENCY = "INR";

type HistoryEntry = TransactionDetail["history"][number];

export type TransactionDoc = {
  _id: string;
  userId: string;
  title: string;
  category: string;
  method: string;
  tone: Transaction["tone"];
  date: string;
  amount: number;
  recurring: boolean;
  type: "expense" | "income";
  note: string;
  search: string;
  createdAt: string;
  history: HistoryEntry[];
};

export async function transactions() {
  return (await getDb()).collection<TransactionDoc>("transactions");
}

const rupees = (n: number) => formatCurrency(n, CURRENCY);
export const round = (n: number) => Math.round(n * 100) / 100;
const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function monthStart(now: Date, back = 0) {
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - back, 1);
}

export function searchText(d: {
  title: string;
  category: string;
  method: string;
  note: string;
  amount: number;
  date: string;
}): string {
  const month = new Intl.DateTimeFormat("en-US", { month: "long", timeZone: "UTC" }).format(
    new Date(d.date),
  );
  return `${d.title} ${d.category} ${d.method} ${d.note} ${Math.abs(d.amount)} ${month}`.toLowerCase();
}

type Tones = Record<string, Transaction["tone"]>;

const toTransaction = (d: TransactionDoc, tones: Tones): Transaction & { recurring: boolean } => ({
  id: d._id,
  title: d.title,
  category: d.category,
  method: d.method,
  tone: tones[d.category] ?? "slate",
  date: d.date,
  amount: d.amount,
  recurring: d.recurring,
});

function toDetail(d: TransactionDoc, tones: Tones): TransactionDetail {
  return {
    ...toTransaction(d, tones),
    type: d.type,
    note: d.note,
    createdAt: d.createdAt,
    currency: CURRENCY,
    history: [...d.history].sort((a, b) => b.at.localeCompare(a.at)),
  };
}

function buildFilter(userId: string, query: TransactionsQuery, now: Date): Filter<TransactionDoc> {
  const filter: Filter<TransactionDoc> = { userId };
  if (query.type === "expense" || query.type === "income") filter.type = query.type;
  if (query.category) filter.category = query.category;
  if (query.method) filter.method = query.method;

  const dayMs = 86_400_000;
  const iso = (ms: number) => new Date(ms).toISOString();
  switch (query.range) {
    case "this-month":
      filter.date = { $gte: iso(monthStart(now)) };
      break;
    case "last-month":
      filter.date = { $gte: iso(monthStart(now, 1)), $lt: iso(monthStart(now)) };
      break;
    case "last-30":
      filter.date = { $gte: iso(now.getTime() - 30 * dayMs) };
      break;
    case "last-90":
      filter.date = { $gte: iso(now.getTime() - 90 * dayMs) };
      break;
  }

  const terms = searchTerms((query.q ?? "").slice(0, SEARCH_MAX_LENGTH));
  if (terms.length > 0) {
    // Every word must match somewhere.
    filter.$and = terms.map((term) => ({ search: { $regex: escapeRegex(term) } }));
  }
  return filter;
}

export async function listTransactions(
  userId: string,
  query: TransactionsQuery,
  now = new Date(),
): Promise<TransactionsPage> {
  const col = await transactions();
  const tones = await toneMap(userId);
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? TRANSACTIONS_PAGE_SIZE;
  const filter = buildFilter(userId, query, now);

  const [items, total, sums] = await Promise.all([
    col
      .find(filter)
      .sort({ date: -1, _id: 1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .toArray(),
    col.countDocuments(filter),
    col
      .aggregate<{ _id: boolean; sum: number }>([
        { $match: filter },
        { $group: { _id: { $lt: ["$amount", 0] }, sum: { $sum: "$amount" } } },
      ])
      .toArray(),
  ]);
  const moneyOut = -(sums.find((s) => s._id)?.sum ?? 0);
  const moneyIn = sums.find((s) => !s._id)?.sum ?? 0;

  return {
    items: items.map((d) => toTransaction(d, tones)),
    total,
    page,
    pageSize,
    query: (query.q ?? "").trim(),
    currency: CURRENCY,
    summary: { moneyOut: round(moneyOut), moneyIn: round(moneyIn), net: round(moneyIn - moneyOut) },
  };
}

/** Every match, unpaged (for CSV export). */
export async function exportTransactions(
  userId: string,
  query: TransactionsQuery,
  now = new Date(),
) {
  const col = await transactions();
  const docs = await col
    .find(buildFilter(userId, query, now))
    .sort({ date: -1, _id: 1 })
    .toArray();
  const tones = await toneMap(userId);
  return docs.map((d) => ({ ...toTransaction(d, tones), type: d.type, note: d.note }));
}

export async function getTransaction(
  userId: string,
  id: string,
): Promise<TransactionDetail | null> {
  const found = await (await transactions()).findOne({ _id: id, userId });
  return found ? toDetail(found, await toneMap(userId)) : null;
}

/** "2026-11-05" -> ISO. Today keeps the current time of day; the past uses midday UTC. Never future. */
function dateToIso(day: string, now: Date, keepTimeOf?: string): string {
  if (keepTimeOf?.slice(0, 10) === day) return keepTimeOf;
  const today = now.toISOString().slice(0, 10);
  if (day >= today) return new Date(now.getTime() - 60_000).toISOString();
  return `${day}T12:00:00.000Z`;
}

export async function createTransaction(
  userId: string,
  input: TransactionInput,
  now = new Date(),
): Promise<TransactionDetail> {
  const id = randomUUID();
  const tones = await toneMap(userId);
  const date = dateToIso(input.date, now);
  const amount = input.type === "expense" ? -input.amount : input.amount;
  const doc: TransactionDoc = {
    _id: id,
    userId,
    title: input.title,
    category: input.category,
    method: input.method,
    tone: tones[input.category] ?? "slate",
    date,
    amount,
    recurring: input.recurring,
    type: input.type,
    note: input.note,
    search: searchText({ ...input, date, amount }),
    createdAt: now.toISOString(),
    history: [{ id: `${id}-created`, label: "Created", detail: "", at: now.toISOString() }],
  };
  await (await transactions()).insertOne(doc);
  return toDetail(doc, tones);
}

export async function updateTransaction(
  userId: string,
  id: string,
  input: TransactionInput,
  now = new Date(),
): Promise<TransactionDetail | null> {
  const col = await transactions();
  const before = await col.findOne({ _id: id, userId });
  if (!before) return null;
  const tones = await toneMap(userId);

  const changes: { label: string; detail: string }[] = [];
  if (Math.abs(before.amount) !== input.amount) {
    changes.push({
      label: "Amount edited",
      detail: `from ${rupees(Math.abs(before.amount))} to ${rupees(input.amount)}`,
    });
  }
  if (before.category !== input.category)
    changes.push({ label: "Category changed", detail: `to ${input.category}` });
  if (before.title !== input.title) changes.push({ label: "Description edited", detail: "" });
  if (before.method !== input.method)
    changes.push({ label: "Payment changed", detail: `to ${input.method}` });
  if (before.date.slice(0, 10) !== input.date) changes.push({ label: "Date changed", detail: "" });
  if (before.note !== input.note) changes.push({ label: "Note edited", detail: "" });
  if (before.recurring !== input.recurring) {
    changes.push({
      label: input.recurring ? "Set to repeat monthly" : "Stopped repeating",
      detail: "",
    });
  }

  const at = now.toISOString();
  const date = dateToIso(input.date, now, before.date);
  const amount = input.type === "expense" ? -input.amount : input.amount;
  const next: TransactionDoc = {
    ...before,
    title: input.title,
    category: input.category,
    method: input.method,
    tone: tones[input.category] ?? "slate",
    date,
    amount,
    recurring: input.recurring,
    type: input.type,
    note: input.note,
    history: [
      ...before.history,
      ...changes.map((change, i) => ({ id: `${id}-edit-${at}-${i}`, ...change, at })),
    ],
    search: searchText({ ...input, date, amount }),
  };
  await col.replaceOne({ _id: id, userId }, next);
  return toDetail(next, tones);
}

export async function deleteTransactions(userId: string, ids: string[]): Promise<number> {
  const result = await (await transactions()).deleteMany({ userId, _id: { $in: ids } });
  return result.deletedCount;
}

/** Expense totals per category (positive numbers) and total income between two instants (UTC ms). */
export async function totalsBetween(
  userId: string,
  startMs: number,
  endMs: number,
  excludeId?: string,
) {
  const rows = await (
    await transactions()
  )
    .aggregate<{ _id: { income: boolean; category: string }; sum: number }>([
      {
        $match: {
          userId,
          date: { $gte: new Date(startMs).toISOString(), $lt: new Date(endMs).toISOString() },
          ...(excludeId ? { _id: { $ne: excludeId } } : {}),
        },
      },
      {
        $group: {
          _id: { income: { $gte: ["$amount", 0] }, category: "$category" },
          sum: { $sum: "$amount" },
        },
      },
    ])
    .toArray();

  const byCategory: Record<string, number> = {};
  let expenses = 0;
  let income = 0;
  for (const { _id, sum } of rows) {
    if (_id.income) income = round(income + sum);
    else {
      byCategory[_id.category] = round(-sum);
      expenses = round(expenses - sum);
    }
  }
  return { byCategory, expenses, income };
}

/** The same, for one calendar month (UTC), `back` months before `now`. */
export const monthTotals = (userId: string, now: Date, back = 0, excludeId?: string) =>
  totalsBetween(userId, monthStart(now, back), monthStart(now, back - 1), excludeId);

/** Expense total per month (key "YYYY-MM") from `startMs` up to `endMs`. */
export async function monthlyExpenses(
  userId: string,
  startMs: number,
  endMs: number,
): Promise<Record<string, number>> {
  const rows = await (
    await transactions()
  )
    .aggregate<{ _id: string; sum: number }>([
      {
        $match: {
          userId,
          amount: { $lt: 0 },
          date: { $gte: new Date(startMs).toISOString(), $lt: new Date(endMs).toISOString() },
        },
      },
      { $group: { _id: { $substrBytes: ["$date", 0, 7] }, sum: { $sum: "$amount" } } },
    ])
    .toArray();
  return Object.fromEntries(rows.map((r) => [r._id, round(-r.sum)]));
}

/** The newest transactions inside [startMs, endMs). */
export async function recentTransactions(
  userId: string,
  startMs: number,
  endMs: number,
  limit: number,
): Promise<Transaction[]> {
  const docs = await (
    await transactions()
  )
    .find({
      userId,
      date: { $gte: new Date(startMs).toISOString(), $lt: new Date(endMs).toISOString() },
    })
    .sort({ date: -1, _id: 1 })
    .limit(limit)
    .toArray();
  const tones = await toneMap(userId);
  return docs.map((d) => toTransaction(d, tones));
}
