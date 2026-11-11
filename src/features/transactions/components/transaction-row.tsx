import { cn } from "@/utils/cn";
import { formatCurrency, formatRelativeDate } from "@/utils/format";
import { TONE_TINT } from "@/features/dashboard/tones";
import type { Transaction } from "../schemas";
import { Highlight } from "./highlight";

type TransactionRowProps = {
  transaction: Transaction;
  currency: string;
  now: Date;
  /** Search terms to highlight in the title and details. */
  terms?: string[];
};

/** One transaction line, shared by the dashboard, the results page and search suggestions. */
export function TransactionRow({ transaction: t, currency, now, terms = [] }: TransactionRowProps) {
  const income = t.amount > 0;
  return (
    <div className="flex items-center gap-4">
      <span
        aria-hidden="true"
        className={cn(
          "grid size-11 shrink-0 place-items-center rounded-[14px] font-display text-lg font-bold",
          TONE_TINT[t.tone],
        )}
      >
        {t.title.charAt(0).toUpperCase()}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold text-ink">
          <Highlight text={t.title} terms={terms} />
        </p>
        <p className="truncate text-[13px] text-muted">
          <Highlight text={`${t.category} · ${t.method}`} terms={terms} /> ·{" "}
          {formatRelativeDate(t.date, now)}
        </p>
      </div>
      <p
        className={cn(
          "shrink-0 font-display text-lg font-bold",
          income ? "text-success" : "text-ink",
        )}
      >
        {income ? "+" : "−"}
        {formatCurrency(Math.abs(t.amount), currency)}
      </p>
    </div>
  );
}
