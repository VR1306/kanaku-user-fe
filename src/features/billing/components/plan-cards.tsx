import { Icon } from "@/components/icons/icon";
import { INTERVAL_LABEL, type BillingInterval } from "@/constants/billing";
import { cn } from "@/utils/cn";
import { formatCurrency } from "@/utils/format";
import type { PlanInfo } from "../schemas";

type Props = {
  plan: PlanInfo;
  interval: BillingInterval;
  currency: string;
  /** This is the user's plan right now. */
  current: boolean;
  /** This is the plan being bought. */
  selected: boolean;
};

/** One plan: name, price for the chosen period, and what it includes. Prices come from the API. */
export function PlanCard({ plan, interval, currency, current, selected }: Props) {
  const price = interval === "monthly" ? plan.monthlyPaise : plan.yearlyPaise;
  const dark = selected;
  return (
    <article
      className={cn(
        "flex h-full flex-col rounded-[24px] p-[29px] transition-colors duration-300",
        dark ? "bg-navy-950 ring-2 ring-accent" : "border border-line bg-surface",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className={cn("text-lg font-bold", dark ? "text-on-inverse" : "text-ink")}>
          {plan.name}
        </h3>
        {selected ? (
          <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-bold text-on-accent">
            Selected
          </span>
        ) : current ? (
          <span className="rounded-full bg-line px-2.5 py-1 text-xs font-bold text-ink-2">
            Current plan
          </span>
        ) : null}
      </div>
      <p
        className={cn(
          "mt-5 font-display text-[32px] leading-tight font-extrabold",
          dark ? "text-on-inverse" : "text-ink",
        )}
      >
        {price === 0 ? (
          "Free"
        ) : (
          <>
            {formatCurrency(price / 100, currency)}
            <span
              className={cn("ml-1.5 text-base font-normal", dark ? "text-slate-400" : "text-muted")}
            >
              / {interval === "monthly" ? "mo" : "yr"}
            </span>
          </>
        )}
      </p>
      <ul className="mt-5 flex flex-col gap-3">
        {plan.features.map((f) => (
          <li
            key={f}
            className={cn(
              "flex items-start gap-2.5 text-[15px]",
              dark ? "text-slate-300" : "text-ink-2",
            )}
          >
            <Icon name="check" size={18} strokeWidth={2.4} className="mt-0.5 shrink-0" />
            {f}
          </li>
        ))}
      </ul>
      <span className="sr-only">Billed per {INTERVAL_LABEL[interval]}.</span>
    </article>
  );
}
