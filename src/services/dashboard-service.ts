/**
 * Dashboard figures computed from the signed-in user's real data in MongoDB: transactions
 * (spending, income, trends, recent activity, recurring bills) and budgets (limits and status).
 */
import { BUDGET_WARN_PERCENT } from "@/constants/budgets";
import type { DashboardData } from "@/features/dashboard/schemas";
import { getDb } from "@/lib/mongo";
import { getBudgets } from "./budgets-service";
import { toneMap } from "./categories-service";
import { unreadCount } from "./notifications-service";
import { upcomingPayments } from "./recurring-service";
import { monthlyExpenses, monthTotals, recentTransactions } from "./transactions-service";

const CURRENCY = "INR";
const RECENT_LIMIT = 5;
const BILLS_LIMIT = 3;

const key = (y: number, m: number) => `${y}-${String(m + 1).padStart(2, "0")}`;
const parseKey = (k: string) => {
  const [y, m] = k.split("-").map(Number);
  return { y, m: m - 1 };
};
const shortMonth = (y: number, m: number) =>
  new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" }).format(Date.UTC(y, m, 1));
const pct = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : 0);

export function currentMonthKey(now = new Date()): string {
  return key(now.getUTCFullYear(), now.getUTCMonth());
}

export async function getDashboard(
  userId: string,
  monthKey: string,
  now = new Date(),
): Promise<DashboardData> {
  const { y, m } = parseKey(monthKey);
  const isCurrent = monthKey === currentMonthKey(now);
  const start = Date.UTC(y, m, 1);
  const end = Date.UTC(y, m + 1, 1);
  const daysInMonth = new Date(end - 1).getUTCDate();
  const today = now.getUTCDate();
  const prev = new Date(Date.UTC(y, m - 1, 1));
  const prevKey = key(prev.getUTCFullYear(), prev.getUTCMonth());
  const trendStart = Date.UTC(y, m - 5, 1);

  const db = await getDb();
  const [totals, trend, recent, recurring, budgets, profile, unread, tones] = await Promise.all([
    monthTotals(userId, new Date(start)),
    monthlyExpenses(userId, trendStart, end),
    recentTransactions(userId, start, end, RECENT_LIMIT),
    isCurrent ? upcomingPayments(userId, BILLS_LIMIT) : Promise.resolve([]),
    getBudgets(userId, new Date(start)),
    db
      .collection<{ _id: string; monthlyIncome?: number | null }>("profiles")
      .findOne({ _id: userId }),
    unreadCount(userId),
    toneMap(userId),
  ]);

  const spent = totals.expenses;
  const prevSpent = trend[prevKey] ?? 0;
  // Income for the month; before any income is logged, fall back to the one given in onboarding.
  const income = totals.income > 0 ? totals.income : (profile?.monthlyIncome ?? 0);
  const saved = Math.round((income - spent) * 100) / 100;

  const total = budgets.overall.limit;
  const remaining = total - spent;
  const daysLeft = isCurrent ? daysInMonth - today : 0;

  const monthlySpending = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(Date.UTC(y, m - (5 - i), 1));
    const k = key(d.getUTCFullYear(), d.getUTCMonth());
    return {
      month: k,
      label: shortMonth(d.getUTCFullYear(), d.getUTCMonth()),
      amount: trend[k] ?? 0,
    };
  });

  const breakdown = Object.entries(totals.byCategory)
    .sort((a, b) => b[1] - a[1])
    .map(([name, amount]) => ({
      id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      name,
      amount,
      percent: pct(amount, spent),
      tone: tones[name] ?? "slate",
    }));

  const categoryBudgets = budgets.items.map((b) => ({
    id: b.id,
    name: b.category,
    spent: b.spent,
    limit: b.limit,
    status:
      b.usedPercent > 100
        ? ("exceeded" as const)
        : b.usedPercent >= BUDGET_WARN_PERCENT
          ? ("warning" as const)
          : ("ok" as const),
    overBy: Math.max(0, b.spent - b.limit),
  }));

  const upcomingBills = recurring.map((r) => ({
    id: r.id,
    title: r.title,
    dueDate: `${r.nextDue}T12:00:00.000Z`,
    amount: r.amount,
  }));

  return {
    month: monthKey,
    asOf: now.toISOString(),
    currency: CURRENCY,
    unreadNotifications: unread,
    summary: {
      spent,
      income,
      saved,
      savingsRate: income > 0 ? Math.round((saved / income) * 1000) / 10 : 0,
      changeVsPreviousPct:
        prevSpent > 0 ? Math.round(((spent - prevSpent) / prevSpent) * 1000) / 10 : null,
      previousMonthLabel: shortMonth(prev.getUTCFullYear(), prev.getUTCMonth()),
    },
    budget: {
      total,
      used: spent,
      remaining,
      usedPct: pct(spent, total),
      daysLeft,
      safeToSpendPerDay: daysLeft > 0 ? Math.max(0, Math.round(remaining / daysLeft)) : null,
    },
    monthlySpending,
    breakdown,
    recentTransactions: recent,
    categoryBudgets,
    upcomingBills,
  };
}
