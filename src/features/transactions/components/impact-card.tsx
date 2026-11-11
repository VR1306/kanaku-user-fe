import { cn } from "@/utils/cn";
import { formatCurrency } from "@/utils/format";
import type { Impact } from "../schemas";

type ImpactCardProps = {
  impact?: Impact;
  /** Eyebrow text: "After saving" on the form, "Budget" on the detail page. */
  heading: string;
  unavailable?: boolean;
};

/** Cyan card showing what's left of the category budget (expenses) or this month's income. */
export function ImpactCard({ impact, heading, unavailable }: ImpactCardProps) {
  const money = (n: number) => formatCurrency(n, "INR");
  return (
    <section aria-live="polite" className="rounded-[24px] bg-accent p-6 text-on-accent">
      <p className="text-xs font-bold tracking-[0.14em] uppercase">
        {heading}
        {impact ? ` · ${impact.category}` : ""}
      </p>
      {unavailable && !impact ? (
        <p className="mt-4 text-sm font-medium">Budget details aren&apos;t available right now.</p>
      ) : !impact ? (
        <p className="mt-4 text-sm font-medium">Pick a category to see your budget.</p>
      ) : impact.kind === "income" ? (
        <>
          <p className="mt-3 font-display text-[34px] leading-tight font-bold">
            +{money(impact.monthIn)}
          </p>
          <p className="mt-2 text-sm font-medium">in income this month</p>
        </>
      ) : impact.budget === 0 ? (
        <>
          <p className="mt-3 font-display text-[34px] leading-tight font-bold">
            {money(impact.spent)}
          </p>
          <p className="mt-2 text-sm font-medium">
            spent this month · no budget set for this category
          </p>
        </>
      ) : (
        <>
          <p className="mt-3 font-display text-[34px] leading-tight font-bold">
            {impact.left < 0 ? `${money(-impact.left)} over` : `${money(impact.left)} left`}
          </p>
          <div
            role="progressbar"
            aria-label="Budget used"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.min(100, impact.usedPercent)}
            className="mt-4 h-2.5 overflow-hidden rounded-full bg-navy-950/15"
          >
            <div
              className={cn("h-full rounded-full bg-navy-950 transition-[width] duration-300")}
              style={{ width: `${Math.min(100, impact.usedPercent)}%` }}
            />
          </div>
          <p className="mt-3 text-sm font-medium">
            {impact.usedPercent}% of this month&apos;s budget used
          </p>
        </>
      )}
    </section>
  );
}
