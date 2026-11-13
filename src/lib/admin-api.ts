import "server-only";

/**
 * Client for the Kanaku Admin Portal's integration API (/api/v1). The Admin Portal owns categories, plans,
 * coupons, support conversations and announcements; this app reads them (public endpoints) or calls the
 * server-to-server endpoints with SERVICE_API_KEY. Env: ADMIN_API_URL, SERVICE_API_KEY.
 */
const base = () => (process.env.ADMIN_API_URL ?? "").trim().replace(/\/+$/, "");

export const adminConfigured = () => base() !== "";

export class AdminApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

type Init = { method?: "GET" | "POST"; body?: unknown; service?: boolean; timeoutMs?: number };

export async function adminFetch<T>(path: string, init: Init = {}): Promise<T> {
  if (!adminConfigured())
    throw new AdminApiError(503, "not_configured", "ADMIN_API_URL is not set");
  const key = process.env.SERVICE_API_KEY;
  if (init.service && !key)
    throw new AdminApiError(503, "not_configured", "SERVICE_API_KEY is not set");
  let res: Response;
  try {
    res = await fetch(`${base()}${path}`, {
      method: init.method ?? "GET",
      headers: {
        accept: "application/json",
        ...(init.body !== undefined && { "content-type": "application/json" }),
        ...(init.service && { authorization: `Bearer ${key}` }),
      },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(init.timeoutMs ?? 3000),
    });
  } catch {
    throw new AdminApiError(502, "unreachable", "The Kanaku admin service is unreachable");
  }
  const json = (await res.json().catch(() => null)) as {
    data?: T;
    error?: { code: string; message: string };
  } | null;
  if (!res.ok)
    throw new AdminApiError(
      res.status,
      json?.error?.code ?? "error",
      json?.error?.message ?? `Admin service responded ${res.status}`,
    );
  return (json && "data" in json ? json.data : json) as T;
}

/** Like `adminFetch` but returns the raw response (for binary content such as announcement images). Service key only. */
export async function adminFetchRaw(path: string, timeoutMs = 8000): Promise<Response> {
  const key = process.env.SERVICE_API_KEY;
  if (!adminConfigured() || !key)
    throw new AdminApiError(503, "not_configured", "Admin service is not configured");
  try {
    return await fetch(`${base()}${path}`, {
      headers: { authorization: `Bearer ${key}` },
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch {
    throw new AdminApiError(502, "unreachable", "The Kanaku admin service is unreachable");
  }
}

/**
 * Cache for admin data with stale-while-revalidate: once a value has been loaded it is ALWAYS returned instantly;
 * when it is older than `ttlMs` a refresh runs in the background, so a page never waits on the Admin Portal after
 * the first load. If the Admin Portal is down the last good value keeps being served; failures are remembered for
 * FAILURE_COOLDOWN_MS so an outage costs one short timeout, not one per request.
 */
const FAILURE_COOLDOWN_MS = 10_000;
export function cachedFetch<T>(ttlMs: number, load: () => Promise<T>, fallback: () => T) {
  let value: { v: T; at: number } | null = null;
  let failedAt = 0;
  let inflight: Promise<T> | null = null;

  const refresh = (): Promise<T> => {
    inflight ??= load()
      .then((v) => {
        value = { v, at: Date.now() };
        failedAt = 0;
        return v;
      })
      .catch((e) => {
        console.error("[admin-api]", e instanceof Error ? e.message : e);
        failedAt = Date.now();
        return value?.v ?? fallback();
      })
      .finally(() => {
        inflight = null;
      });
    return inflight;
  };

  return async (): Promise<T> => {
    const age = value ? Date.now() - value.at : Infinity;
    if (value && age < ttlMs) return value.v; // fresh
    const cooling = failedAt && Date.now() - failedAt < FAILURE_COOLDOWN_MS;
    if (value) {
      if (!cooling) void refresh(); // stale: refresh in the background, answer now
      return value.v;
    }
    if (cooling) return fallback(); // never loaded and the admin is down: don't retry on every request
    return refresh(); // very first load only
  };
}
