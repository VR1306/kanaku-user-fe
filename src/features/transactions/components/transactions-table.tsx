"use client";

import Link from "next/link";
import { Icon } from "@/components/icons/icon";
import { transactionRoute } from "@/constants/routes";
import { TONE_TINT } from "@/features/dashboard/tones";
import { cn } from "@/utils/cn";
import { usePreferences } from "@/features/settings/components/preferences-provider";
import { formatCurrency } from "@/utils/format";
import type { Transaction, TransactionsPage } from "../schemas";
import { Highlight } from "./highlight";

const GRID =
  "md:grid-cols-[20px_minmax(0,2.6fr)_minmax(0,1.5fr)_minmax(0,1.2fr)_minmax(0,1.1fr)_minmax(0,1fr)]";

type TableProps = {
  data: TransactionsPage;
  terms: string[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: (checked: boolean) => void;
  loading: boolean;
  onPage: (page: number) => void;
};

const checkboxClass = "size-[18px] rounded-[4px] accent-brand";

function Row({
  t,
  data,
  terms,
  checked,
  onToggle,
}: {
  t: Transaction;
  data: TransactionsPage;
  terms: string[];
  checked: boolean;
  onToggle: () => void;
}) {
  const income = t.amount > 0;
  const { formatDate } = usePreferences();
  return (
    <li
      className={cn(
        "grid grid-cols-[20px_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 border-t border-line-soft px-5 py-3 transition-colors hover:bg-page/60 md:px-7",
        GRID,
        checked && "bg-brand-tint/40",
      )}
    >
      <input
        type="checkbox"
        aria-label={`Select ${t.title}`}
        checked={checked}
        onChange={onToggle}
        className={checkboxClass}
      />
      <div className="flex min-w-0 items-center gap-3">
        <span
          aria-hidden="true"
          className={cn(
            "grid size-[42px] shrink-0 place-items-center rounded-[13px] font-display text-[17px] font-bold",
            TONE_TINT[t.tone],
          )}
        >
          {t.title.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <Link
            href={transactionRoute(t.id)}
            className="block truncate text-[15px] font-semibold text-ink hover:underline"
          >
            <Highlight text={t.title} terms={terms} />
          </Link>
          {t.recurring ? (
            <p className="text-xs font-semibold text-accent-deep">↻ Recurring</p>
          ) : null}
          <p className="truncate text-[13px] text-muted md:hidden">
            {t.category} · {formatDate(t.date)}
          </p>
        </div>
      </div>
      <span
        className={cn(
          "hidden w-fit rounded-full px-3 py-1 text-[13px] font-semibold md:inline-block",
          TONE_TINT[t.tone],
        )}
      >
        <Highlight text={t.category} terms={terms} />
      </span>
      <span className="hidden truncate text-[15px] text-muted md:block">
        <Highlight text={t.method} terms={terms} />
      </span>
      <span className="hidden text-[15px] text-muted md:block">{formatDate(t.date)}</span>
      <span
        className={cn(
          "text-right font-display text-lg font-bold",
          income ? "text-success" : "text-ink",
        )}
      >
        {income ? "+" : "−"}
        {formatCurrency(Math.abs(t.amount), data.currency)}
      </span>
    </li>
  );
}

/** Page numbers to show: the first, the last and a window around the current page. */
function pageWindow(page: number, count: number): (number | "…")[] {
  const pages = new Set([1, count, page - 1, page, page + 1].filter((p) => p >= 1 && p <= count));
  const sorted = [...pages].sort((a, b) => a - b);
  return sorted.flatMap((p, i) => (i > 0 && p - sorted[i - 1] > 1 ? ["…" as const, p] : [p]));
}

export function TransactionsTable({
  data,
  terms,
  selected,
  onToggle,
  onToggleAll,
  loading,
  onPage,
}: TableProps) {
  const pageCount = Math.max(1, Math.ceil(data.total / data.pageSize));
  const allChecked = data.items.length > 0 && data.items.every((t) => selected.has(t.id));
  const pageBtn = "grid size-11 place-items-center rounded-[12px] border text-sm transition-colors";

  return (
    <section
      aria-busy={loading}
      className={cn(
        "overflow-hidden rounded-[24px] border border-line bg-surface transition-opacity duration-200",
        loading && "opacity-60",
      )}
    >
      <div
        className={cn(
          "grid grid-cols-[20px_minmax(0,1fr)_auto] items-center gap-x-4 bg-page px-5 py-[19px] text-xs font-bold tracking-[0.08em] text-muted md:px-7",
          GRID,
        )}
      >
        <input
          type="checkbox"
          aria-label="Select all on this page"
          checked={allChecked}
          onChange={(e) => onToggleAll(e.target.checked)}
          className={checkboxClass}
        />
        <span>TRANSACTION</span>
        <span className="hidden md:block">CATEGORY</span>
        <span className="hidden md:block">PAYMENT</span>
        <span className="hidden md:block">DATE</span>
        <span className="text-right">AMOUNT</span>
      </div>

      <ul>
        {data.items.map((t) => (
          <Row
            key={t.id}
            t={t}
            data={data}
            terms={terms}
            checked={selected.has(t.id)}
            onToggle={() => onToggle(t.id)}
          />
        ))}
      </ul>

      <nav
        aria-label="Pagination"
        className="flex flex-wrap items-center justify-between gap-3 border-t border-line-soft px-5 py-[17px] md:px-7"
      >
        <p role="status" className="text-sm text-muted">
          Showing {data.items.length} of {data.total}
        </p>
        {pageCount > 1 ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Previous page"
              disabled={data.page <= 1}
              onClick={() => onPage(data.page - 1)}
              className={cn(pageBtn, "border-line bg-surface text-link disabled:opacity-40")}
            >
              <Icon name="chevronLeft" size={16} strokeWidth={2.2} />
            </button>
            {pageWindow(data.page, pageCount).map((p, i) =>
              p === "…" ? (
                <span key={`gap-${i}`} aria-hidden="true" className="px-1 text-muted">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  type="button"
                  aria-label={`Page ${p}`}
                  aria-current={p === data.page ? "page" : undefined}
                  onClick={() => onPage(p)}
                  className={cn(
                    pageBtn,
                    p === data.page
                      ? "border-brand bg-brand font-bold text-on-primary"
                      : "border-line bg-surface text-link hover:bg-page",
                  )}
                >
                  {p}
                </button>
              ),
            )}
            <button
              type="button"
              aria-label="Next page"
              disabled={data.page >= pageCount}
              onClick={() => onPage(data.page + 1)}
              className={cn(pageBtn, "border-line bg-surface text-link disabled:opacity-40")}
            >
              <Icon name="chevronLeft" size={16} strokeWidth={2.2} className="rotate-180" />
            </button>
          </div>
        ) : null}
      </nav>
    </section>
  );
}
