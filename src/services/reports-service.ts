/**
 * Reports computed from the signed-in user's transactions in MongoDB: income vs expenses over a
 * period, this month vs last month by category, an insight and the most used payment method.
 */
import { REPORT_RANGES, type ReportRange } from "@/constants/reports";
import type { ReportData } from "@/features/reports/schemas";
import { formatCurrency } from "@/utils/format";
import { toneMap } from "./categories-service";
import { bucketTotals, methodCounts } from "./transactions-extra";
import { monthTotals } from "./transactions-service";

const CURRENCY = "INR";
const round = (n: number) => Math.round(n * 100) / 100;
const fmt = (opts: Intl.DateTimeFormatOptions, d: Date) =>
  new Intl.DateTimeFormat("en-US", { ...opts, timeZone: "UTC" }).format(d);
const monthKey = (d: Date) => d.toISOString().slice(0, 7);

export async function getReport(
  userId: string,
  range: ReportRange,
  now = new Date(),
): Promise<ReportData> {
  const months = REPORT_RANGES.find((r) => r.value === range)?.months ?? 6;
  const granularity: "day" | "month" = months === 1 ? "day" : "month";
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const first = new Date(Date.UTC(y, m - (months - 1), 1));
  const end = Date.UTC(y, m + 1, 1);

  const [buckets, thisMonth, lastMonth, methods, tones] = await Promise.all([
    bucketTotals(userId, first.getTime(), end, granularity),
    monthTotals(userId, now, 0),
    monthTotals(userId, now, 1),
    methodCounts(userId, Date.UTC(y, m, 1), end),
    toneMap(userId),
  ]);

  // One point per day (so far this month) or per month, including the empty ones.
  const series =
    granularity === "day"
      ? Array.from({ length: now.getUTCDate() }, (_, i) => {
          const d = new Date(Date.UTC(y, m, i + 1));
          const key = d.toISOString().slice(0, 10);
          return { key, label: String(i + 1), ...fill(buckets[key]) };
        })
      : Array.from({ length: months }, (_, i) => {
          const d = new Date(Date.UTC(y, m - (months - 1) + i, 1));
          const key = monthKey(d);
          return { key, label: fmt({ month: "short" }, d), ...fill(buckets[key]) };
        });

  const totalSpent = round(series.reduce((n, p) => n + p.expenses, 0));
  const totalIncome = series.reduce((n, p) => n + p.income, 0);
  const top = series.reduce((best, p) => (p.expenses > best.expenses ? p : best), series[0]);
  const peak =
    top && top.expenses > 0
      ? {
          label:
            granularity === "day"
              ? fmt({ day: "numeric", month: "short" }, new Date(`${top.key}T12:00:00Z`))
              : fmt({ month: "short" }, new Date(`${top.key}-01T12:00:00Z`)),
          amount: top.expenses,
          unit: granularity,
        }
      : null;

  // Categories: this month against last month.
  const prevDate = new Date(Date.UTC(y, m - 1, 1));
  const names = new Set([
    ...Object.keys(thisMonth.byCategory),
    ...Object.keys(lastMonth.byCategory),
  ]);
  const rows = [...names]
    .map((name) => {
      const current = thisMonth.byCategory[name] ?? 0;
      const previous = lastMonth.byCategory[name] ?? 0;
      return {
        name,
        tone: tones[name] ?? "slate",
        previous,
        current,
        changePct: previous > 0 ? Math.round(((current - previous) / previous) * 1000) / 10 : null,
      };
    })
    .sort((a, b) => b.current - a.current || b.previous - a.previous);

  const peakMethod = Object.entries(methods).sort((a, b) => b[1] - a[1])[0];
  const methodTotal = Object.values(methods).reduce((n, c) => n + c, 0);

  return {
    range,
    currency: CURRENCY,
    periodLabel: periodLabel(first, now, months),
    granularity,
    summary: {
      totalSpent,
      totalSaved: round(totalIncome - totalSpent),
      averagePerMonth: round(totalSpent / months),
      peak,
    },
    series,
    categories: {
      currentLabel: fmt({ month: "short" }, now),
      previousLabel: fmt({ month: "short" }, prevDate),
      rows,
    },
    insight: insight(rows, fmt({ month: "long" }, prevDate)),
    topMethod:
      peakMethod && methodTotal > 0
        ? { name: peakMethod[0], percent: Math.round((peakMethod[1] / methodTotal) * 100) }
        : null,
  };
}

const fill = (b?: { income: number; expenses: number }) => ({
  income: b?.income ?? 0,
  expenses: b?.expenses ?? 0,
});

function periodLabel(first: Date, now: Date, months: number): string {
  if (months === 1) return fmt({ month: "long", year: "numeric" }, now);
  const sameYear = first.getUTCFullYear() === now.getUTCFullYear();
  return `${fmt(sameYear ? { month: "long" } : { month: "long", year: "numeric" }, first)} – ${fmt({ month: "long", year: "numeric" }, now)}`;
}

function insight(rows: ReportData["categories"]["rows"], lastMonth: string): string | null {
  const risen = rows
    .filter((r) => r.changePct !== null && r.changePct >= 5)
    .sort((a, b) => (b.changePct ?? 0) - (a.changePct ?? 0))[0];
  if (risen && risen.changePct !== null) {
    return `${risen.name} rose ${Math.round(risen.changePct)}% this month. Trimming it back to ${lastMonth}'s level saves ${formatCurrency(risen.current - risen.previous, CURRENCY)}.`;
  }
  const fallen = rows
    .filter((r) => r.changePct !== null && r.changePct <= -5)
    .sort((a, b) => (a.changePct ?? 0) - (b.changePct ?? 0))[0];
  if (fallen && fallen.changePct !== null) {
    return `${fallen.name} spending is down ${Math.round(Math.abs(fallen.changePct))}% on ${lastMonth}. Keep it up.`;
  }
  return null;
}
