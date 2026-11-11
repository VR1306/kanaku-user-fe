"use client";

import { Icon } from "@/components/icons/icon";
import { useCategories } from "@/features/categories/components/categories-provider";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Select } from "@/components/ui/select";
import { SEARCH_MAX_LENGTH } from "@/constants/search";
import { FOCUS_FIELD } from "@/constants/styles";
import {
  DATE_RANGES,
  PAYMENT_METHODS,
  TYPE_FILTERS,
  type DateRange,
  type TypeFilter,
} from "@/constants/transactions";
import { cn } from "@/utils/cn";
import type { useTransactionFilters } from "../hooks/use-transaction-filters";

type Props = { state: ReturnType<typeof useTransactionFilters> };

const METHOD_OPTIONS = [
  { value: "", label: "All payment modes" },
  ...PAYMENT_METHODS.map((m) => ({ value: m, label: m })),
];

export function TransactionsFilters({ state }: Props) {
  const { text, filters, setText, setFilter, clear, active } = state;
  const { items } = useCategories();
  const CATEGORY_OPTIONS = [
    { value: "", label: "All categories" },
    ...items.map((c) => ({ value: c.name, label: c.name })),
  ];
  return (
    <section
      aria-label="Filters"
      className="flex flex-col gap-3 rounded-[20px] border border-line bg-surface p-[17px]"
    >
      <div className="flex flex-wrap items-center gap-3">
        <SegmentedControl
          aria-label="Transaction type"
          variant="page"
          options={TYPE_FILTERS}
          value={filters.type}
          onChange={(type) => setFilter({ type: type as TypeFilter })}
        />

        <div role="search" className="relative min-w-[200px] flex-1 basis-[240px]">
          <label htmlFor="transactions-search" className="sr-only">
            Search description or note
          </label>
          <Icon
            name="search"
            size={16}
            className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-subtle"
          />
          <input
            id="transactions-search"
            type="search"
            autoComplete="off"
            maxLength={SEARCH_MAX_LENGTH}
            placeholder="Search description or note"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className={cn(
              "h-12 w-full rounded-control border border-line bg-surface pr-4 pl-10 text-[15px] text-ink placeholder:text-subtle",
              FOCUS_FIELD,
            )}
          />
        </div>

        <Select
          compact
          aria-label="Category"
          className="w-full sm:w-[176px]"
          value={filters.category}
          options={CATEGORY_OPTIONS}
          onChange={(e) => setFilter({ category: e.target.value })}
        />
        <Select
          compact
          aria-label="Payment mode"
          className="w-full sm:w-[190px]"
          value={filters.method}
          options={METHOD_OPTIONS}
          onChange={(e) => setFilter({ method: e.target.value })}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select
          compact
          aria-label="Date range"
          className="w-full sm:max-w-[320px] sm:flex-1"
          value={filters.range}
          options={DATE_RANGES.map((r) => ({ value: r.value, label: r.label }))}
          onChange={(e) => setFilter({ range: e.target.value as DateRange })}
        />
        {active ? (
          <button
            type="button"
            onClick={clear}
            className="inline-flex h-12 items-center gap-1.5 rounded-control px-3 text-sm font-semibold text-link hover:underline"
          >
            <Icon name="close" size={14} strokeWidth={2.4} />
            Clear filters
          </button>
        ) : null}
      </div>
    </section>
  );
}
