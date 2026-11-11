/**
 * More transaction queries and writes: period totals for reports, payments logged by recurring
 * schedules, and CSV import. Shares the collection and helpers with transactions-service.ts.
 */
import { createHash } from "node:crypto";
import { isDuplicateKey } from "@/lib/mongo";
import { toneMap } from "./categories-service";
import { round, searchText, transactions, type TransactionDoc } from "./transactions-service";

/** Income and expense totals per day ("YYYY-MM-DD") or month ("YYYY-MM") between two instants. */
export async function bucketTotals(
  userId: string,
  startMs: number,
  endMs: number,
  granularity: "day" | "month",
): Promise<Record<string, { income: number; expenses: number }>> {
  const rows = await (
    await transactions()
  )
    .aggregate<{ _id: { bucket: string; income: boolean }; sum: number }>([
      {
        $match: {
          userId,
          date: { $gte: new Date(startMs).toISOString(), $lt: new Date(endMs).toISOString() },
        },
      },
      {
        $group: {
          _id: {
            bucket: { $substrBytes: ["$date", 0, granularity === "day" ? 10 : 7] },
            income: { $gte: ["$amount", 0] },
          },
          sum: { $sum: "$amount" },
        },
      },
    ])
    .toArray();
  const out: Record<string, { income: number; expenses: number }> = {};
  for (const { _id, sum } of rows) {
    const entry = (out[_id.bucket] ??= { income: 0, expenses: 0 });
    if (_id.income) entry.income = round(entry.income + sum);
    else entry.expenses = round(entry.expenses - sum);
  }
  return out;
}

/** Expense count per payment method between two instants. */
export async function methodCounts(
  userId: string,
  startMs: number,
  endMs: number,
): Promise<Record<string, number>> {
  const rows = await (
    await transactions()
  )
    .aggregate<{ _id: string; count: number }>([
      {
        $match: {
          userId,
          amount: { $lt: 0 },
          date: { $gte: new Date(startMs).toISOString(), $lt: new Date(endMs).toISOString() },
        },
      },
      { $group: { _id: "$method", count: { $sum: 1 } } },
    ])
    .toArray();
  return Object.fromEntries(rows.map((r) => [r._id, r.count]));
}

/**
 * Records a payment made automatically by a recurring schedule. The id is derived from the
 * schedule and date, so running the same occurrence twice never creates a duplicate.
 * Returns whether a transaction was created.
 */
export async function logScheduledTransaction(
  userId: string,
  input: {
    id: string;
    title: string;
    category: string;
    method: string;
    type: "expense" | "income";
    /** Positive. */
    amount: number;
    /** ISO 8601. */
    date: string;
  },
  now = new Date(),
): Promise<boolean> {
  const amount = input.type === "expense" ? -input.amount : input.amount;
  const doc: TransactionDoc = {
    _id: input.id,
    userId,
    title: input.title,
    category: input.category,
    method: input.method,
    tone: (await toneMap(userId))[input.category] ?? "slate",
    date: input.date,
    amount,
    recurring: true,
    type: input.type,
    note: "",
    search: searchText({ ...input, note: "", amount }),
    createdAt: now.toISOString(),
    history: [
      {
        id: `${input.id}-created`,
        label: "Created",
        detail: "Logged automatically by a recurring payment",
        at: now.toISOString(),
      },
    ],
  };
  try {
    await (await transactions()).insertOne(doc);
    return true;
  } catch (error) {
    if (isDuplicateKey(error)) return false;
    throw error;
  }
}

export type ImportRow = {
  title: string;
  category: string;
  method: string;
  type: "expense" | "income";
  /** Positive. */
  amount: number;
  /** YYYY-MM-DD. */
  date: string;
  note: string;
  recurring: boolean;
};

/**
 * Inserts rows read from a CSV file. Each row gets an id derived from its content, so importing
 * the same file twice adds nothing the second time. Returns how many were new.
 */
export async function importTransactions(
  userId: string,
  rows: ImportRow[],
  now = new Date(),
): Promise<number> {
  if (rows.length === 0) return 0;
  // Skip rows that match a transaction you already have (same day, description, amount, category),
  // so importing your own export, or the same file twice, adds nothing.
  const days = rows.map((r) => r.date).sort();
  const existing = await (
    await transactions()
  )
    .find({
      userId,
      date: { $gte: `${days[0]}T00:00:00.000Z`, $lt: `${days[days.length - 1]}T99` },
    })
    .project<{ date: string; title: string; amount: number; category: string }>({
      date: 1,
      title: 1,
      amount: 1,
      category: 1,
    })
    .toArray();
  const have = new Map<string, number>();
  for (const e of existing) {
    const key = `${e.date.slice(0, 10)}|${e.title}|${Math.abs(e.amount)}|${e.category}`;
    have.set(key, (have.get(key) ?? 0) + 1);
  }
  rows = rows.filter((r) => {
    const key = `${r.date}|${r.title}|${r.amount}|${r.category}`;
    const n = have.get(key) ?? 0;
    if (n > 0) have.set(key, n - 1);
    return n === 0;
  });
  if (rows.length === 0) return 0;
  const tones = await toneMap(userId);
  const seen = new Map<string, number>();
  const docs: TransactionDoc[] = rows.map((r) => {
    const base = [r.date, r.title, r.category, r.method, r.type, r.amount, r.note].join("|");
    const n = seen.get(base) ?? 0;
    seen.set(base, n + 1);
    const id = `imp-${createHash("sha1").update(`${userId}|${base}|${n}`).digest("hex").slice(0, 24)}`;
    const date = `${r.date}T12:00:00.000Z`;
    const amount = r.type === "expense" ? -r.amount : r.amount;
    return {
      _id: id,
      userId,
      title: r.title,
      category: r.category,
      method: r.method,
      tone: tones[r.category] ?? "slate",
      date,
      amount,
      recurring: r.recurring,
      type: r.type,
      note: r.note,
      search: searchText({ ...r, date, amount }),
      createdAt: now.toISOString(),
      history: [
        {
          id: `${id}-created`,
          label: "Created",
          detail: "Imported from CSV",
          at: now.toISOString(),
        },
      ],
    };
  });
  try {
    const result = await (await transactions()).insertMany(docs, { ordered: false });
    return result.insertedCount;
  } catch (error) {
    // Rows that already exist fail with a duplicate key; the rest were still inserted.
    const inserted =
      (error as { insertedCount?: number; result?: { insertedCount?: number } }).insertedCount ??
      (error as { result?: { insertedCount?: number } }).result?.insertedCount;
    if (isDuplicateKey(error) || (error as { name?: string }).name === "MongoBulkWriteError") {
      return inserted ?? 0;
    }
    throw error;
  }
}
