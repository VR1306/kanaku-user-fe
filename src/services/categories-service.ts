/**
 * Categories backed by MongoDB (collection: categories). Every user gets the default categories
 * the first time they are needed and can then add, recolour, rename and delete their own.
 * Transactions, budgets and recurring payments refer to a category by name; renaming or deleting
 * one moves those references along.
 */
import { FALLBACK_CATEGORY } from "@/constants/categories";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  type TransactionType,
} from "@/constants/transactions";
import type { CategoryInput, CategoryItem } from "@/features/categories/schemas";
import type { Tone } from "@/features/transactions/schemas";
import { getDb, isDuplicateKey } from "@/lib/mongo";
import { randomUUID } from "node:crypto";

type CategoryDoc = {
  _id: string;
  userId: string;
  name: string;
  /** Lowercased name: unique per user. */
  nameKey: string;
  type: TransactionType;
  tone: Tone;
  order: number;
  createdAt: Date;
};

const g = globalThis as unknown as { __kanakuCategoriesSeeded?: Set<string> };
const seeded = () => (g.__kanakuCategoriesSeeded ??= new Set());

const keyOf = (name: string) => name.trim().toLowerCase();
const round = (n: number) => Math.round(n * 100) / 100;

async function categories() {
  return (await getDb()).collection<CategoryDoc>("categories");
}

/** Creates the default categories for a user who has none yet. */
export async function ensureDefaultCategories(userId: string): Promise<void> {
  if (seeded().has(userId)) return;
  const col = await categories();
  if ((await col.countDocuments({ userId }, { limit: 1 })) === 0) {
    const now = new Date();
    const defaults = [
      ...EXPENSE_CATEGORIES.map((c) => ({ ...c, type: "expense" as const })),
      ...INCOME_CATEGORIES.map((c) => ({ ...c, type: "income" as const })),
    ];
    await col
      .insertMany(
        defaults.map((c, order) => ({
          _id: randomUUID(),
          userId,
          name: c.name,
          nameKey: keyOf(c.name),
          type: c.type,
          tone: c.tone,
          order,
          createdAt: now,
        })),
        { ordered: false },
      )
      .catch((error) => {
        if (!isDuplicateKey(error) && (error as { code?: number }).code !== 65) throw error;
      });
  }
  seeded().add(userId);
}

/** Name -> tone for everything the user has. Unknown names fall back to "slate" at the call site. */
export async function toneMap(userId: string): Promise<Record<string, Tone>> {
  await ensureDefaultCategories(userId);
  const docs = await (await categories()).find({ userId }).toArray();
  return Object.fromEntries(docs.map((d) => [d.name, d.tone]));
}

export async function toneOf(userId: string, name: string): Promise<Tone> {
  return (await toneMap(userId))[name] ?? "slate";
}

export async function categoryExists(
  userId: string,
  type: TransactionType,
  name: string,
): Promise<boolean> {
  await ensureDefaultCategories(userId);
  return (await (await categories()).countDocuments({ userId, type, name }, { limit: 1 })) > 0;
}

/** Categories with this month's activity and the budget, in display order. */
export async function listCategories(userId: string, now = new Date()): Promise<CategoryItem[]> {
  await ensureDefaultCategories(userId);
  const db = await getDb();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)).toISOString();

  const [docs, stats, budgets] = await Promise.all([
    categories().then((c) => c.find({ userId }).sort({ order: 1, createdAt: 1 }).toArray()),
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
    id: d._id,
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
  { ok: true; value: T } | { ok: false; code: "not_found" | "duplicate" | "protected" };

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

export async function createCategory(
  userId: string,
  input: CategoryInput,
): Promise<CategoryResult<{ id: string }>> {
  await ensureDefaultCategories(userId);
  const col = await categories();
  const last = await col.find({ userId }).sort({ order: -1 }).limit(1).toArray();
  const id = randomUUID();
  try {
    await col.insertOne({
      _id: id,
      userId,
      name: input.name,
      nameKey: keyOf(input.name),
      type: input.type,
      tone: input.tone,
      order: (last[0]?.order ?? 0) + 1,
      createdAt: new Date(),
    });
  } catch (error) {
    if (isDuplicateKey(error)) return { ok: false, code: "duplicate" };
    throw error;
  }
  if (input.type === "expense") await setBudget(userId, input.name, input.budget);
  return { ok: true, value: { id } };
}

/** Points everything that refers to category `from` at `to` instead. */
async function moveReferences(userId: string, from: string, to: string, dropBudget: boolean) {
  const db = await getDb();
  await Promise.all([
    db.collection("transactions").updateMany({ userId, category: from }, [
      {
        $set: {
          category: to,
          search: {
            $replaceAll: {
              input: "$search",
              find: from.toLowerCase(),
              replacement: to.toLowerCase(),
            },
          },
        },
      },
    ]),
    db.collection("recurring").updateMany({ userId, category: from }, { $set: { category: to } }),
    dropBudget
      ? db.collection("budgets").deleteMany({ userId, category: from })
      : db.collection("budgets").updateMany({ userId, category: from }, { $set: { category: to } }),
  ]);
}

export async function updateCategory(
  userId: string,
  id: string,
  input: CategoryInput,
): Promise<CategoryResult<{ id: string }>> {
  const col = await categories();
  const found = await col.findOne({ _id: id, userId });
  if (!found) return { ok: false, code: "not_found" };
  const renamed = input.name !== found.name;
  if (renamed && Object.values(FALLBACK_CATEGORY).includes(found.name as never)) {
    return { ok: false, code: "protected" };
  }
  try {
    await col.updateOne(
      { _id: id, userId },
      { $set: { name: input.name, nameKey: keyOf(input.name), tone: input.tone } },
    );
  } catch (error) {
    if (isDuplicateKey(error)) return { ok: false, code: "duplicate" };
    throw error;
  }
  if (renamed) await moveReferences(userId, found.name, input.name, false);
  if (found.type === "expense") await setBudget(userId, input.name, input.budget);
  return { ok: true, value: { id } };
}

/** The "Other" category for a type, created if the user doesn't have it. Returns its name. */
export async function ensureFallback(userId: string, type: TransactionType): Promise<string> {
  const col = await categories();
  const name = FALLBACK_CATEGORY[type];
  if (!(await col.findOne({ userId, nameKey: keyOf(name) }))) {
    await col
      .insertOne({
        _id: randomUUID(),
        userId,
        name,
        nameKey: keyOf(name),
        type,
        tone: "slate",
        order: 1000,
        createdAt: new Date(),
      })
      .catch((error) => {
        if (!isDuplicateKey(error)) throw error;
      });
  }
  return name;
}

/**
 * Deletes a category. Its transactions and recurring payments move to the fallback "Other"
 * category; its budget is removed.
 */
export async function deleteCategory(
  userId: string,
  id: string,
): Promise<CategoryResult<{ movedTo: string }>> {
  const col = await categories();
  const found = await col.findOne({ _id: id, userId });
  if (!found) return { ok: false, code: "not_found" };
  if (Object.values(FALLBACK_CATEGORY).includes(found.name as never)) {
    return { ok: false, code: "protected" };
  }
  const fallback = await ensureFallback(userId, found.type);
  await moveReferences(userId, found.name, fallback, true);
  await col.deleteOne({ _id: id, userId });
  return { ok: true, value: { movedTo: fallback } };
}
