"use client";

import { m as motion } from "framer-motion";
import { TRANSITION } from "@/constants/motion";
import { formatCurrency } from "@/utils/format";
import type { DashboardData } from "../schemas";

type CardProps = { data: DashboardData };

const BARS = "M8 15h4v8H8zM14 9h4v14h-4zM20 12h4v11h-4z";

/** Blue hero card: spending this month, trend vs last month, income / saved / savings rate. */
export function SpendHeroCard({ data }: CardProps) {
  const { summary, currency } = data;
  const fmt = (n: number) => formatCurrency(n, currency);
  const change = summary.changeVsPreviousPct;

  return (
    <section
      aria-label="Spending this month"
      className="relative overflow-hidden rounded-card bg-brand p-8 text-on-inverse"
    >
      <svg
        viewBox="0 0 32 32"
        aria-hidden="true"
        className="pointer-events-none absolute -top-10 -right-8 size-[220px] text-accent opacity-[0.08]"
      >
        <path d={BARS} fill="currentColor" />
      </svg>

      <p className="text-[13px] tracking-[0.14em] text-accent-pale">SPENT THIS MONTH</p>
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
        <p className="font-display text-5xl leading-none font-bold sm:text-[64px]">
          {fmt(summary.spent)}
        </p>
        {change !== null ? (
          <span className="rounded-full bg-brand-light px-3 py-1 text-[13px] font-semibold text-on-inverse">
            {change >= 0 ? "▲" : "▼"} {Math.abs(change)}% vs {summary.previousMonthLabel}
          </span>
        ) : null}
      </div>

      <dl className="mt-8 grid grid-cols-3 gap-4 border-t border-brand-light pt-5">
        <Stat label="Income" value={fmt(summary.income)} />
        <Stat label="Saved" value={fmt(summary.saved)} accent />
        <Stat label="Savings rate" value={`${summary.savingsRate}%`} />
      </dl>
    </section>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <dt className="text-[13px] text-brand-pale">{label}</dt>
      <dd
        className={`mt-1 font-display text-xl font-bold sm:text-2xl ${accent ? "text-accent" : "text-on-inverse"}`}
      >
        {value}
      </dd>
    </div>
  );
}

/** Cyan card: what is left of the monthly budget, progress, and a safe daily spend. */
export function BudgetRemainingCard({ data }: CardProps) {
  const { budget, currency } = data;
  const fmt = (n: number) => formatCurrency(n, currency);
  const over = budget.remaining < 0;

  return (
    <section
      aria-label="Budget remaining"
      className="flex flex-col rounded-card bg-accent p-8 text-on-accent"
    >
      <p className="text-[13px] font-bold tracking-[0.14em]">
        {over ? "OVER BUDGET BY" : "BUDGET REMAINING"}
      </p>
      <p className="mt-3 font-display text-[44px] leading-none font-bold sm:text-[52px]">
        {fmt(Math.abs(budget.remaining))}
      </p>

      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.min(100, budget.usedPct)}
        aria-label="Budget used"
        className="mt-5 h-3 overflow-hidden rounded-full bg-navy-950/20"
      >
        <motion.div
          className="h-full origin-left rounded-full bg-navy-950"
          style={{ width: `${Math.min(100, budget.usedPct)}%` }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={TRANSITION}
        />
      </div>
      <p className="mt-3 text-[15px] font-medium">
        {budget.usedPct}% of {fmt(budget.total)} used ·{" "}
        {budget.daysLeft > 0 ? `${budget.daysLeft} days left` : "month closed"}
      </p>

      <p className="mt-auto rounded-control bg-navy-950/10 px-3.5 py-2.5 pt-2.5 text-sm font-semibold">
        {budget.safeToSpendPerDay !== null
          ? `Safe to spend: ${fmt(budget.safeToSpendPerDay)} / day`
          : "This month has ended"}
      </p>
    </section>
  );
}
