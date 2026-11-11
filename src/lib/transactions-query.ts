import { transactionsQuerySchema } from "@/features/transactions/schemas";

/** Reads the list/export filters from a URL; empty values are treated as "not set". */
export function parseTransactionsQuery(params: URLSearchParams) {
  const pick = (key: string) => params.get(key) || undefined;
  return transactionsQuerySchema.safeParse({
    q: pick("q"),
    type: pick("type"),
    category: pick("category"),
    method: pick("method"),
    range: pick("range"),
    page: pick("page"),
    pageSize: pick("pageSize"),
  });
}
