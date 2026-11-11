export type DataSourceMeta = { source: "database" };

/** One response shape for every BFF endpoint: `{ data, meta }` or `{ error: { code, message } }`. */
const NO_STORE = { "Cache-Control": "private, no-store" };

export function apiOk<T>(data: T, meta?: DataSourceMeta, status = 200) {
  return Response.json({ data, meta }, { status, headers: NO_STORE });
}

export function apiError(status: number, code: string, message: string) {
  return Response.json({ error: { code, message } }, { status, headers: NO_STORE });
}
