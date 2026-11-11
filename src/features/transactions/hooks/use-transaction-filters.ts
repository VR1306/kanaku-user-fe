"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  DATE_RANGES,
  TYPE_FILTERS,
  type DateRange,
  type TypeFilter,
} from "@/constants/transactions";
import { SEARCH_DEBOUNCE_MS } from "@/constants/search";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { NO_FILTERS, type TransactionFilters } from "../api";

const oneOf = <T extends string>(options: readonly { value: T }[], value: string | null, d: T): T =>
  options.find((o) => o.value === value)?.value ?? d;

/**
 * Filters + page for the transactions list, kept in the URL so a filtered view can be shared or
 * reloaded. The search box is debounced; the other filters apply immediately.
 */
export function useTransactionFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [text, setText] = useState(params.get("q") ?? "");
  const [rest, setRest] = useState({
    type: oneOf<TypeFilter>(TYPE_FILTERS, params.get("type"), NO_FILTERS.type),
    category: params.get("category") ?? "",
    method: params.get("method") ?? "",
    range: oneOf<DateRange>(DATE_RANGES, params.get("range"), NO_FILTERS.range),
  });
  const [page, setPage] = useState(
    Math.max(1, Number.parseInt(params.get("page") ?? "1", 10) || 1),
  );
  const q = useDebouncedValue(text.trim(), SEARCH_DEBOUNCE_MS);
  const filters: TransactionFilters = { q, ...rest };

  useEffect(() => {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    if (rest.type !== "all") next.set("type", rest.type);
    if (rest.category) next.set("category", rest.category);
    if (rest.method) next.set("method", rest.method);
    if (rest.range !== "all") next.set("range", rest.range);
    if (page > 1) next.set("page", String(page));
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [q, rest, page, pathname, router]);

  const active =
    text.trim() !== "" ||
    rest.type !== "all" ||
    rest.category ||
    rest.method ||
    rest.range !== "all";

  return {
    text,
    filters,
    page,
    active: Boolean(active),
    setText: (value: string) => {
      setText(value);
      setPage(1);
    },
    setFilter: (patch: Partial<typeof rest>) => {
      setRest((r) => ({ ...r, ...patch }));
      setPage(1);
    },
    setPage,
    clear: () => {
      setText("");
      setRest({ type: "all", category: "", method: "", range: "all" });
      setPage(1);
    },
  };
}
