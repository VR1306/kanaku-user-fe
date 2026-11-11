import { TONE_DOT, TONE_TINT } from "@/features/dashboard/tones";
import { cn } from "@/utils/cn";
import { formatCurrency } from "@/utils/format";
import type { BudgetItem, BudgetsOverview } from "../schemas";

const money = (n: number, currency: string) => formatCurrency(n, currency);

/** The blue hero: overall monthly budget, remaining, days left and per-day allowance. */
export function OverallCard({ data, onEdit }: { data: BudgetsOverview; onEdit: () => void }) {
  const { overall, currency } = data;
  const used = Math.min(100, overall.usedPercent);
  const resets = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(data.resetsOn));
  const stat = (label: string, value: string, accent?: boolean) => (
    <div className="min-w-0 rounded-[18px] border border-brand-light bg-navy-800 px-3.5 py-4 sm:min-w-[96px] sm:px-5">
      <dt className="text-[13px] text-brand-pale">{label}</dt>
      <dd
        className={cn(
          "mt-2 font-display text-[26px] leading-none font-bold",
          accent ? "text-accent" : "text-on-primary",
        )}
      >
        {value}
      </dd>
    </div>
  );
  return (
    <section
      aria-label="Overall monthly budget"
      className="relative overflow-hidden rounded-[28px] bg-brand p-8 text-on-primary"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 32 32"
        className="pointer-events-none absolute top-6 right-20 size-[260px] opacity-[0.07]"
      >
        <path d="M8 15h4v8H8zM14 9h4v14h-4zM20 12h4v11h-4z" className="fill-accent" />
      </svg>
      <div className="relative flex flex-wrap items-start justify-between gap-x-10 gap-y-6">
        <div className="min-w-[260px] flex-1">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[13px] tracking-[0.14em] text-accent-pale">OVERALL MONTHLY BUDGET</p>
            <button
              type="button"
              onClick={onEdit}
              className="rounded-full border border-brand-light px-3.5 py-1 text-[13px] font-semibold text-on-primary transition-colors hover:bg-white/10"
            >
              Change
            </button>
          </div>
          <p className="mt-4 flex flex-wrap items-baseline gap-x-3">
            <span className="font-display text-[44px] leading-none font-bold sm:text-[60px]">
              {money(overall.spent, currency)}
            </span>
            <span className="font-display text-[22px] font-bold text-brand-pale sm:text-[26px]">
              / {money(overall.limit, currency)}
            </span>
          </p>
          <div
            role="progressbar"
            aria-label="Overall budget used"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={used}
            className="mt-6 h-3.5 max-w-[462px] overflow-hidden rounded-full bg-brand-light"
          >
            <div
              className={cn(
                "h-full rounded-full transition-[width] duration-500",
                overall.usedPercent > 100 ? "bg-danger" : "bg-accent",
              )}
              style={{ width: `${used}%` }}
            />
          </div>
          <p className="mt-4 text-sm text-brand-pale">
            {overall.usedPercent}% used · resets on {resets}
          </p>
        </div>
        <dl className="grid w-full grid-cols-3 gap-2.5 sm:flex sm:w-auto sm:flex-wrap sm:gap-3">
          {stat(
            overall.remaining < 0 ? "Over by" : "Remaining",
            money(Math.abs(overall.remaining), currency),
            true,
          )}
          {stat("Days left", String(overall.daysLeft))}
          {stat("Per day", money(overall.perDay, currency))}
        </dl>
      </div>
    </section>
  );
}

const PILL = {
  "on-track": "bg-success-tint text-success",
  warning: "bg-accent-tint text-accent-deep",
  over: "bg-danger text-on-danger",
} as const;

export function BudgetCard({
  budget: b,
  currency,
  onEdit,
}: {
  budget: BudgetItem;
  currency: string;
  onEdit: () => void;
}) {
  const over = b.status === "over";
  const width = Math.min(100, b.usedPercent);
  return (
    <article
      className={cn(
        "flex h-full flex-col rounded-[24px] border bg-surface p-6",
        over ? "border-danger" : "border-line",
      )}
    >
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-[12px] font-display text-[17px] leading-none font-bold",
            TONE_TINT[b.tone],
          )}
        >
          {b.category.charAt(0)}
        </span>
        <h3 className="min-w-0 flex-1 text-base leading-tight font-bold break-words hyphens-auto text-ink">
          {b.category}
        </h3>
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-1 text-xs leading-none font-bold whitespace-nowrap",
            PILL[b.status],
          )}
        >
          {over ? "Over budget" : b.status === "warning" ? `${b.usedPercent}% used` : "On track"}
        </span>
      </div>

      <p className="mt-6 flex flex-wrap items-baseline gap-x-2">
        <span className="font-display text-[32px] leading-none font-bold text-ink">
          {money(b.spent, currency)}
        </span>
        <span className="font-display text-base font-medium text-muted">
          of {money(b.limit, currency)}
        </span>
      </p>

      <div
        role="progressbar"
        aria-label={`${b.category} budget used`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={width}
        className="mt-5 h-2.5 overflow-hidden rounded-full bg-line-soft"
      >
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-500",
            over ? "bg-danger" : TONE_DOT[b.tone],
          )}
          style={{ width: `${width}%` }}
        />
      </div>

      <div className="mt-auto flex items-end justify-between gap-3 pt-5">
        <div className="text-sm text-muted">
          <p>
            {over ? `${money(-b.left, currency)} over limit` : `${money(b.left, currency)} left`}
          </p>
          {b.rolledOver > 0 ? (
            <p className="text-xs">Includes {money(b.rolledOver, currency)} rolled over</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onEdit}
          aria-label={`Edit ${b.category} budget`}
          className="h-[38px] rounded-[10px] border border-line-strong bg-surface px-4 text-[13px] font-semibold text-link transition-colors hover:bg-page"
        >
          Edit
        </button>
      </div>
    </article>
  );
}
