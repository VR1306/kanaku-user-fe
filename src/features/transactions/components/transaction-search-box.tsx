"use client";

import { useId, useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons/icon";
import { ROUTES, transactionRoute } from "@/constants/routes";
import {
  SEARCH_DEBOUNCE_MS,
  SEARCH_MAX_LENGTH,
  SEARCH_MIN_CHARS,
  SEARCH_SUGGESTIONS,
} from "@/constants/search";
import { FOCUS_FIELD } from "@/constants/styles";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useMountTime } from "@/hooks/use-mount-time";
import { cn } from "@/utils/cn";
import { useTransactionSearch } from "../hooks/use-transaction-search";
import { searchTerms } from "../terms";
import { TransactionRow } from "./transaction-row";

const resultsUrl = (q: string) => `${ROUTES.transactions}?q=${encodeURIComponent(q)}`;

/**
 * Header search with live suggestions (ARIA combobox). Type to see matches, arrow keys to move,
 * Enter to open the full results page, Escape to close.
 */
export function TransactionSearchBox({ className }: { className?: string }) {
  const router = useRouter();
  const listId = useId();
  const mountTime = useMountTime();
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  const query = useDebouncedValue(value.trim(), SEARCH_DEBOUNCE_MS);
  const enabled = value.trim().length >= SEARCH_MIN_CHARS;
  const { data, error, loading } = useTransactionSearch({
    params: enabled ? { q: query, pageSize: SEARCH_SUGGESTIONS } : null,
  });

  const items = enabled && data?.query === query ? data.items : [];
  const total = enabled && data?.query === query ? data.total : 0;
  const showPanel = open && enabled;
  // Options: each suggestion, then "see all".
  const optionCount = items.length + (total > 0 ? 1 : 0);
  const optionId = (i: number) => `${listId}-opt-${i}`;
  const now = new Date(mountTime);
  const terms = searchTerms(value);

  function go(q: string) {
    setOpen(false);
    router.push(resultsUrl(q));
  }

  function choose(index: number) {
    if (index >= 0 && index < items.length) {
      setOpen(false);
      router.push(transactionRoute(items[index].id)); // open the transaction itself
    } else go(value.trim());
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((a) => (optionCount ? (a + 1) % optionCount : -1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (optionCount ? (a <= 0 ? optionCount - 1 : a - 1) : -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (!value.trim()) return;
      choose(showPanel ? active : -1);
    } else if (e.key === "Escape") {
      if (open) {
        e.preventDefault();
        setOpen(false);
      } else {
        setValue("");
      }
    }
  }

  return (
    <div
      className={cn("relative", className)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
      }}
    >
      <label htmlFor={`${listId}-input`} className="sr-only">
        Search transactions
      </label>
      <div className="relative">
        <Icon
          name="search"
          size={18}
          className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-subtle"
        />
        <input
          id={`${listId}-input`}
          type="text"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showPanel && active >= 0 ? optionId(active) : undefined}
          autoComplete="off"
          maxLength={SEARCH_MAX_LENGTH}
          placeholder="Search transactions…"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className={cn(
            "h-12 w-full rounded-control border border-line bg-surface pr-4 pl-11 text-[15px] text-ink placeholder:text-subtle",
            FOCUS_FIELD,
          )}
        />
      </div>

      {showPanel ? (
        <div
          className="absolute top-full left-0 z-40 mt-2 w-[min(400px,calc(100vw-2rem))] overflow-hidden rounded-[18px] border border-line bg-surface shadow-lg"
          onMouseDown={(e) => e.preventDefault()} // keep input focus while clicking
        >
          <ul id={listId} role="listbox" aria-label="Transaction suggestions">
            {items.map((t, i) => (
              <li
                key={t.id}
                id={optionId(i)}
                role="option"
                aria-selected={active === i}
                onClick={() => choose(i)}
                onMouseEnter={() => setActive(i)}
                className={cn("cursor-pointer px-4 py-2.5", active === i && "bg-page")}
              >
                <TransactionRow
                  transaction={t}
                  currency={data?.currency ?? "INR"}
                  now={now}
                  terms={terms}
                />
              </li>
            ))}
            {total > 0 ? (
              <li
                id={optionId(items.length)}
                role="option"
                aria-selected={active === items.length}
                onClick={() => choose(items.length)}
                onMouseEnter={() => setActive(items.length)}
                className={cn(
                  "cursor-pointer border-t border-line-soft px-4 py-3 text-sm font-semibold text-accent-deep",
                  active === items.length && "bg-page",
                )}
              >
                See all {total} {total === 1 ? "result" : "results"} →
              </li>
            ) : null}
          </ul>
          {loading && items.length === 0 ? (
            <p role="status" className="px-4 py-5 text-sm text-muted">
              Searching…
            </p>
          ) : null}
          {error ? (
            <p role="alert" className="px-4 py-5 text-sm text-danger">
              {error.message}
            </p>
          ) : null}
          {!loading && !error && items.length === 0 ? (
            <p role="status" className="px-4 py-5 text-sm text-muted">
              No transactions match “{value.trim()}”.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
