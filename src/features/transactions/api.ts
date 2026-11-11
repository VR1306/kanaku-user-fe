import { z } from "zod";
import { API_ROUTES } from "@/constants/api";
import type { DateRange, TypeFilter } from "@/constants/transactions";
import { apiGet, apiSend } from "@/services/api-client";
import {
  impactSchema,
  transactionDetailSchema,
  transactionsPageSchema,
  type TransactionInput,
} from "./schemas";

export type TransactionFilters = {
  q: string;
  type: TypeFilter;
  category: string;
  method: string;
  range: DateRange;
};

export const NO_FILTERS: TransactionFilters = {
  q: "",
  type: "all",
  category: "",
  method: "",
  range: "all",
};

export type SearchParams = Partial<TransactionFilters> & { page?: number; pageSize?: number };

/** Query string for the list and export endpoints; unset / default values are left out. */
export function filtersToParams({ page, pageSize, ...f }: SearchParams): URLSearchParams {
  const params = new URLSearchParams();
  if (f.q) params.set("q", f.q);
  if (f.type && f.type !== "all") params.set("type", f.type);
  if (f.category) params.set("category", f.category);
  if (f.method) params.set("method", f.method);
  if (f.range && f.range !== "all") params.set("range", f.range);
  if (page) params.set("page", String(page));
  if (pageSize) params.set("pageSize", String(pageSize));
  return params;
}

/** Lists transactions through the BFF. No filters = everything, newest first. */
export function fetchTransactions(params: SearchParams, signal?: AbortSignal) {
  return apiGet(
    `${API_ROUTES.transactions}?${filtersToParams(params)}`,
    transactionsPageSchema,
    signal,
  );
}

export const exportUrl = (filters: Partial<TransactionFilters>) =>
  `${API_ROUTES.transactionsExport}?${filtersToParams(filters)}`;

const itemUrl = (id: string) => `${API_ROUTES.transactions}/${encodeURIComponent(id)}`;

export const fetchTransaction = (id: string, signal?: AbortSignal) =>
  apiGet(itemUrl(id), transactionDetailSchema, signal);

export const createTransaction = (input: TransactionInput) =>
  apiSend("POST", API_ROUTES.transactions, transactionDetailSchema, input);

export const updateTransaction = (id: string, input: TransactionInput) =>
  apiSend("PATCH", itemUrl(id), transactionDetailSchema, input);

export const deleteTransaction = (id: string) =>
  apiSend("DELETE", itemUrl(id), z.object({ id: z.string() }));

export const deleteTransactions = (ids: string[]) =>
  apiSend("DELETE", API_ROUTES.transactions, z.object({ deleted: z.number() }), { ids });

export function fetchImpact(
  input: { type: string; category: string; amount?: number; excludeId?: string },
  signal?: AbortSignal,
) {
  const params = new URLSearchParams({ type: input.type, category: input.category });
  if (input.amount) params.set("amount", String(input.amount));
  if (input.excludeId) params.set("excludeId", input.excludeId);
  return apiGet(`${API_ROUTES.transactionImpact}?${params}`, impactSchema, signal);
}
