/**
 * Categories are owned by the Admin Portal: this app reads the admin's enabled categories and users
 * cannot create, rename, recolour or delete them (the API refuses). Users keep their own monthly
 * budget per category. Transactions, budgets and recurring payments refer to a category by name.
 * If the Admin Portal is unreachable the last good copy is served; if none was ever loaded, the
 * built-in starter set is used so the app stays usable.
 */
import { FALLBACK_CATEGORY } from "@/constants/categories";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  type TransactionType,
} from "@/constants/transactions";
import type { CategoryItem } from "@/features/categories/schemas";
import type { Tone } from "@/features/transactions/schemas";
import { adminFetch, cachedFetch } from "@/lib/admin-api";
import { getDb } from "@/lib/mongo";
import { budgetLimitReached } from "./entitlements-service";
import { randomUUID } from "node:crypto";

export type AdminCategory = { id: string; name: string; type: TransactionType; tone: Tone };

const COLOUR_TONE: Record<string, Tone> = {
  cyan: "accent",
  blue: "brand",
  rose: "danger",
  green: "success",
  violet: "violet",
  amber: "accent",
  slate: "slate",
};
const round = (n: number) => Math.round(n * 100) / 100;

const builtIn = (): AdminCategory[] => [
  ...EXPENSE_CATEGORIES.map((c) => ({ ...c, id: `builtin:${c.name}`, type: "expense" as const })),
  ...INCOME_CATEGORIES.map((c) => ({ ...c, id: `builtin:${c.name}`, type: "income" as const })),
];

const adminCategories = cachedFetch<AdminCategory[]>(
  30_000,
  async () => {
    const rows = await adminFetch<
      Array<{ id: string; name: string; kind: TransactionType; color: string }>
    >("/api/v1/public/categories");
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      type: r.kind,
      tone: COLOUR_TONE[r.color] ?? "slate",
    }));
  },
  builtIn,
);

/** Name -> tone for everything the admin offers. Unknown names fall back to "slate" at the call site. */
// The user id is accepted so callers needn't change; categories are the same for everyone.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function toneMap(_userId?: string): Promise<Record<string, Tone>> {
  return Object.fromEntries((await adminCategories()).map((c) => [c.name, c.tone]));
}

export async function toneOf(userId: string, name: string): Promise<Tone> {
  return (await toneMap(userId))[name] ?? "slate";
}

export async function categoryExists(
  _userId: string,
  type: TransactionType,
  name: string,
): Promise<boolean> {
  return (await adminCategories()).some((c) => c.type === type && c.name === name);
}

/** Categories with this month's activity and the budget, in display order. */
export async function listCategories(userId: string, now = new Date()): Promise<CategoryItem[]> {
  const db = await getDb();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)).toISOString();

  const [docs, stats, budgets] = await Promise.all([
    adminCategories(),
    db
      .collection("transactions")
      .aggregate<{ _id: string; count: number; total: number }>([
        { $match: { userId, date: { $gte: start, $lt: end } } },
        { $group: { _id: "$category", count: { $sum: 1 }, total: { $sum: { $abs: "$amount" } } } },
      ])
      .toArray(),
    db.collection<{ category: string; limit: number }>("budgets").find({ userId }).toArray(),
  ]);
  const byName = new Map(stats.map((s) => [s._id, s]));
  const limits = new Map(budgets.map((b) => [b.category, b.limit]));
  const fallbacks: string[] = Object.values(FALLBACK_CATEGORY);

  return docs.map((d) => ({
    id: d.id,
    name: d.name,
    type: d.type,
    tone: d.tone,
    monthCount: byName.get(d.name)?.count ?? 0,
    monthTotal: round(byName.get(d.name)?.total ?? 0),
    budget: d.type === "expense" ? (limits.get(d.name) ?? null) : null,
    fallback: fallbacks.includes(d.name),
  }));
}

export type CategoryResult<T> =
  { ok: true; value: T } | { ok: false; code: "not_found" | "plan_limit" };

async function setBudget(userId: string, name: string, budget: number | null) {
  const col = (await getDb()).collection<{
    _id: string;
    userId: string;
    category: string;
    limit: number;
    rollover: boolean;
  }>("budgets");
  if (budget === null) {
    await col.deleteOne({ userId, category: name });
    return;
  }
  await col.updateOne(
    { userId, category: name },
    { $set: { limit: budget }, $setOnInsert: { _id: randomUUID(), rollover: false } },
    { upsert: true },
  );
}

/** The only thing a user may change on a category: their own monthly budget (expense categories). */
export async function setCategoryBudget(
  userId: string,
  id: string,
  budget: number | null,
): Promise<CategoryResult<{ id: string }>> {
  const found = (await adminCategories()).find((c) => c.id === id);
  if (!found) return { ok: false, code: "not_found" };
  // A new budget counts against the plan's allowance (changing or removing an existing one never does).
  if (found.type === "expense" && budget !== null && (await budgetLimitReached(userId, found.name)))
    return { ok: false, code: "plan_limit" };
  if (found.type === "expense") await setBudget(userId, found.name, budget);
  return { ok: true, value: { id } };
}

/** The "Other" category an import falls back to. It is part of the admin's category set, so nothing is created here. */
export async function ensureFallback(_userId: string, type: TransactionType): Promise<string> {
  return FALLBACK_CATEGORY[type];
}
