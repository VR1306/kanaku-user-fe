/**
 * Budgets backed by MongoDB: `budgets` (one document per category per user) and `profiles`
 * (the overall monthly limit and alert preference). "Spent" is always computed from the user's
 * transactions, so budgets move as transactions change.
 */
import { BUDGET_ROUND_TO, BUDGET_WARN_PERCENT } from "@/constants/budgets";
import { SUGGESTED_BUDGET_WEIGHTS } from "@/constants/onboarding";
import type { BudgetInput, BudgetsOverview, BudgetStatus } from "@/features/budgets/schemas";
import type { Impact } from "@/features/transactions/schemas";
import { getDb, isDuplicateKey } from "@/lib/mongo";
import { randomUUID } from "node:crypto";
import { categoryExists, toneMap } from "./categories-service";
import { monthTotals } from "./transactions-service";

type StoredBudget = {
  _id: string;
  userId: string;
  category: string;
  limit: number;
  rollover: boolean;
};

async function budgets() {
  return (await getDb()).collection<StoredBudget>("budgets");
}
async function profiles() {
  return (await getDb()).collection<{
    _id: string;
    overallBudget?: number;
    alertsEnabled?: boolean;
  }>("profiles");
}

const round = (n: number) => Math.round(n * 100) / 100;

/** Replaces all budgets with the ones chosen during onboarding. Limits are a weighted split. */
export async function initBudgets(userId: string, overall: number, categories: string[]) {
  const total = categories.reduce((n, c) => n + (SUGGESTED_BUDGET_WEIGHTS[c] ?? 5), 0) || 1;
  const col = await budgets();
  await col.deleteMany({ userId });
  if (categories.length > 0) {
    await col.insertMany(
      categories.map((category) => ({
        _id: randomUUID(),
        userId,
        category,
        limit: Math.max(
          BUDGET_ROUND_TO,
          Math.round(
            (overall * (SUGGESTED_BUDGET_WEIGHTS[category] ?? 5)) / total / BUDGET_ROUND_TO,
          ) * BUDGET_ROUND_TO,
        ),
        rollover: false,
      })),
    );
  }
  await (
    await profiles()
  ).updateOne(
    { _id: userId },
    { $set: { overallBudget: overall, alertsEnabled: true } },
    { upsert: true },
  );
}

const statusOf = (used: number): BudgetStatus =>
  used > 100 ? "over" : used >= BUDGET_WARN_PERCENT ? "warning" : "on-track";

export async function getBudgets(userId: string, now = new Date()): Promise<BudgetsOverview> {
  const [list, profile, thisMonth, lastMonth, tones] = await Promise.all([
    budgets().then((c) => c.find({ userId }).sort({ category: 1 }).toArray()),
    profiles().then((c) => c.findOne({ _id: userId })),
    monthTotals(userId, now),
    monthTotals(userId, now, 1),
    toneMap(userId),
  ]);
  const overall = profile?.overallBudget ?? 0;

  const items = list.map((b) => {
    const rolledOver = b.rollover
      ? Math.max(0, round(b.limit - (lastMonth.byCategory[b.category] ?? 0)))
      : 0;
    const limit = b.limit + rolledOver;
    const spent = thisMonth.byCategory[b.category] ?? 0;
    const usedPercent = limit > 0 ? Math.round((spent / limit) * 100) : 0;
    return {
      id: b._id,
      category: b.category,
      tone: tones[b.category] ?? "slate",
      baseLimit: b.limit,
      limit,
      rolledOver,
      rollover: b.rollover,
      period: "monthly" as const,
      spent,
      left: round(limit - spent),
      usedPercent,
      status: statusOf(usedPercent),
    };
  });

  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const daysLeft = daysInMonth - now.getUTCDate();
  const remaining = round(overall - thisMonth.expenses);

  return {
    currency: "INR",
    month: `${year}-${String(month + 1).padStart(2, "0")}`,
    resetsOn: new Date(Date.UTC(year, month + 1, 1)).toISOString(),
    overall: {
      limit: overall,
      spent: thisMonth.expenses,
      remaining,
      usedPercent: overall > 0 ? Math.round((thisMonth.expenses / overall) * 100) : 0,
      daysLeft,
      perDay: daysLeft > 0 ? Math.max(0, Math.round(remaining / daysLeft)) : Math.max(0, remaining),
    },
    alertsEnabled: profile?.alertsEnabled ?? true,
    items,
  };
}

export type BudgetResult<T> =
  { ok: true; value: T } | { ok: false; code: "not_found" | "duplicate" | "invalid_category" };

export async function createBudget(
  userId: string,
  input: BudgetInput,
): Promise<BudgetResult<{ id: string }>> {
  if (!(await categoryExists(userId, "expense", input.category))) {
    return { ok: false, code: "invalid_category" };
  }
  const id = randomUUID();
  try {
    await (
      await budgets()
    ).insertOne({
      _id: id,
      userId,
      category: input.category,
      limit: input.limit,
      rollover: input.rollover,
    });
  } catch (error) {
    if (isDuplicateKey(error)) return { ok: false, code: "duplicate" };
    throw error;
  }
  return { ok: true, value: { id } };
}

export async function updateBudget(
  userId: string,
  id: string,
  input: BudgetInput,
): Promise<BudgetResult<{ id: string }>> {
  if (!(await categoryExists(userId, "expense", input.category))) {
    return { ok: false, code: "invalid_category" };
  }
  try {
    const result = await (
      await budgets()
    ).updateOne(
      { _id: id, userId },
      { $set: { category: input.category, limit: input.limit, rollover: input.rollover } },
    );
    return result.matchedCount ? { ok: true, value: { id } } : { ok: false, code: "not_found" };
  } catch (error) {
    if (isDuplicateKey(error)) return { ok: false, code: "duplicate" };
    throw error;
  }
}

export async function deleteBudget(userId: string, id: string): Promise<boolean> {
  return (await (await budgets()).deleteOne({ _id: id, userId })).deletedCount > 0;
}

export async function updateSettings(
  userId: string,
  patch: { overallLimit?: number; alertsEnabled?: boolean },
) {
  const set: Record<string, unknown> = {};
  if (patch.overallLimit !== undefined) set.overallBudget = patch.overallLimit;
  if (patch.alertsEnabled !== undefined) set.alertsEnabled = patch.alertsEnabled;
  if (Object.keys(set).length === 0) return;
  await (await profiles()).updateOne({ _id: userId }, { $set: set }, { upsert: true });
}

/** How a transaction affects this month's category budget (expense) or income total (income). */
export async function transactionImpact(
  userId: string,
  input: { type: "expense" | "income"; category: string; amount?: number; excludeId?: string },
  now = new Date(),
): Promise<Impact> {
  const totals = await monthTotals(userId, now, 0, input.excludeId);
  const extra = input.amount ?? 0;
  if (input.type === "income") {
    return { kind: "income", category: input.category, monthIn: round(totals.income + extra) };
  }
  const b = await (await budgets()).findOne({ userId, category: input.category });
  const budget = b?.limit ?? 0;
  const spent = round((totals.byCategory[input.category] ?? 0) + extra);
  return {
    kind: "budget",
    category: input.category,
    budget,
    spent,
    left: round(budget - spent),
    usedPercent: budget > 0 ? Math.round((spent / budget) * 100) : 0,
  };
}
