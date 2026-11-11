"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  type TransactionType,
} from "@/constants/transactions";
import type { Tone } from "@/features/transactions/schemas";
import { fetchCategories } from "../api";
import type { CategoryItem } from "../schemas";

/** What a picker needs to show a category. */
export type CategoryOption = { name: string; short: string; tone: Tone };

type CategoriesContextValue = {
  items: CategoryItem[];
  /** Categories of one type, in display order. */
  byType: (type: TransactionType) => CategoryOption[];
  /** Re-reads the list (call after creating, editing or deleting a category). */
  refresh: () => Promise<void>;
};

const SHORT: Record<string, string> = Object.fromEntries(
  [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES].map((c) => [c.name, c.short]),
);
/** A shorter label for tight spaces ("Fun" for Entertainment); custom names are used as typed. */
export const shortName = (name: string) => SHORT[name] ?? name;

const CategoriesContext = createContext<CategoriesContextValue>({
  items: [],
  byType: () => [],
  refresh: async () => {},
});

export const useCategories = () => useContext(CategoriesContext);

/** Holds the user's categories so every picker and filter shows the same, current list. */
export function CategoriesProvider({
  initial,
  children,
}: {
  initial: CategoryItem[];
  children: ReactNode;
}) {
  const [items, setItems] = useState(initial);

  const refresh = useCallback(async () => {
    try {
      const { data } = await fetchCategories();
      setItems(data.items);
    } catch {
      /* keep what we have */
    }
  }, []);

  const value = useMemo<CategoriesContextValue>(
    () => ({
      items,
      byType: (type) =>
        items
          .filter((c) => c.type === type)
          .map((c) => ({ name: c.name, short: shortName(c.name), tone: c.tone })),
      refresh,
    }),
    [items, refresh],
  );

  return <CategoriesContext.Provider value={value}>{children}</CategoriesContext.Provider>;
}
