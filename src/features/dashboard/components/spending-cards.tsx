"use client";

import { BarChart } from "@/components/charts/bar-chart";
import { DonutChart } from "@/components/charts/donut-chart";
import { SectionCard } from "@/components/ui/section-card";
import { ROUTES } from "@/constants/routes";
import { formatCompact, formatCurrency } from "@/utils/format";
import type { DashboardData } from "../schemas";
import { TONE_COLOR, TONE_DOT } from "../tones";

type CardProps = { data: DashboardData };

export function MonthlySpendingCard({ data }: CardProps) {
  const { monthlySpending, currency } = data;
  return (
    <SectionCard
      title="Monthly spending"
      action={{ label: "Full report", href: ROUTES.reports }}
      className="flex flex-col"
    >
      <div className="mt-auto">
        <BarChart
          activeIndex={monthlySpending.length - 1}
          data={monthlySpending.map((m) => ({
            id: m.month,
            label: m.label,
            value: m.amount,
            valueLabel: formatCompact(m.amount),
            description: `${m.label}: ${formatCurrency(m.amount, currency)}`,
          }))}
        />
      </div>
    </SectionCard>
  );
}

export function SpendingBreakdownCard({ data }: CardProps) {
  const { breakdown, summary, currency } = data;
  if (breakdown.length === 0) {
    return (
      <SectionCard title="Where it went">
        <p className="py-10 text-center text-sm text-muted">No spending recorded this month.</p>
      </SectionCard>
    );
  }
  return (
    <SectionCard title="Where it went">
      <div className="flex justify-center">
        <DonutChart
          centerLabel="Total"
          centerValue={`₹${formatCompact(summary.spent)}`}
          segments={breakdown.map((b) => ({
            id: b.id,
            percent: b.percent,
            color: TONE_COLOR[b.tone],
            label: b.name,
          }))}
        />
      </div>
      <ul className="mt-5 flex flex-col gap-2.5">
        {breakdown.map((b) => (
          <li
            key={b.id}
            className="grid grid-cols-[12px_1fr_auto_40px] items-center gap-x-3 text-sm"
          >
            <span className={`size-3 rounded-[4px] ${TONE_DOT[b.tone]}`} aria-hidden="true" />
            <span className="truncate text-ink-2">{b.name}</span>
            <span className="font-bold text-ink">{formatCurrency(b.amount, currency)}</span>
            <span className="text-right text-muted">{b.percent}%</span>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
