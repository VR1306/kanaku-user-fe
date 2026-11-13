"use client";

import { m as motion } from "framer-motion";
import { SectionCard } from "@/components/ui/section-card";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/utils/cn";
import { formatCurrency, formatShortDate } from "@/utils/format";
import { TransactionRow } from "@/features/transactions/components/transaction-row";
import type { DashboardData } from "../schemas";

type CardProps = { data: DashboardData; now: Date };

const empty = (text: string) => <p className="py-8 text-center text-sm text-muted">{text}</p>;

export function RecentTransactionsCard({ data, now }: CardProps) {
  const { recentTransactions, currency } = data;
  return (
    <SectionCard
      title="Recent transactions"
      action={{ label: "View all", href: ROUTES.transactions }}
    >
      {recentTransactions.length === 0 ? (
        empty("No transactions yet. Add your first expense to see it here.")
      ) : (
        <ul>
          {recentTransactions.map((t) => (
            <li key={t.id} className="border-b border-line-soft py-3 last:border-b-0">
              <TransactionRow transaction={t} currency={currency} now={now} />
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

const BAR_COLOR = { ok: "bg-success", warning: "bg-accent", exceeded: "bg-danger" } as const;

export function BudgetsCard({ data }: Pick<CardProps, "data">) {
  const { categoryBudgets, currency } = data;
  const fmt = (n: number) => formatCurrency(n, currency);
  return (
    <SectionCard title="Budgets" action={{ label: "Manage", href: ROUTES.budgets }}>
      {categoryBudgets.length === 0 ? (
        empty("No category budgets set yet.")
      ) : (
        <ul className="flex flex-col gap-4">
          {categoryBudgets.map((b) => {
            const pct = Math.min(100, (b.spent / b.limit) * 100);
            return (
              <li key={b.id}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="font-semibold text-ink">{b.name}</span>
                  {b.status === "exceeded" ? (
                    <span className="font-bold text-danger">Over by {fmt(b.overBy)}</span>
                  ) : (
                    <span className="text-muted">
                      {fmt(b.spent)} / {fmt(b.limit)}
                    </span>
                  )}
                </div>
                <div
                  role="progressbar"
                  aria-label={`${b.name} budget used`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(pct)}
                  className="mt-2 h-2 overflow-hidden rounded-full bg-line-soft"
                >
                  <motion.div
                    className={cn("h-full origin-left rounded-full", BAR_COLOR[b.status])}
                    style={{ width: `${pct}%` }}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}

export function UpcomingBillsCard({ data }: Pick<CardProps, "data">) {
  const { upcomingBills, currency } = data;
  return (
    <SectionCard title="Upcoming bills" action={{ label: "All", href: ROUTES.recurringPayments }}>
      {upcomingBills.length === 0 ? (
        empty("No bills due soon.")
      ) : (
        <ul className="flex flex-col gap-4">
          {upcomingBills.map((b) => (
            <li key={b.id} className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-[15px] font-semibold text-ink">{b.title}</p>
                <p className="text-[13px] text-muted">Due {formatShortDate(b.dueDate)}</p>
              </div>
              <p className="shrink-0 text-[15px] font-bold text-ink">
                {formatCurrency(b.amount, currency)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
