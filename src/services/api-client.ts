import type { ZodType } from "zod";
import { API_TIMEOUT_MS } from "@/constants/api";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type RequestOptions = { method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"; body?: unknown };

/** Calls a BFF endpoint, with a timeout, and validates the payload against a zod schema. */
async function request<T, M = unknown>(
  url: string,
  schema: ZodType<T>,
  signal?: AbortSignal,
  { method = "GET", body }: RequestOptions = {},
): Promise<{ data: T; meta?: M }> {
  const timeout = AbortSignal.timeout(API_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(url, {
      method,
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
      headers: {
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    if (signal?.aborted) throw error; // caller cancelled: let it through untouched
    throw new ApiError("The server took too long to respond. Please try again.", 0, "network");
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw new ApiError("The server sent an unreadable response.", response.status, "bad_response");
  }

  if (!response.ok) {
    const err = (json as { error?: { code?: string; message?: string } })?.error;
    throw new ApiError(
      err?.message ?? "Something went wrong.",
      response.status,
      err?.code ?? "error",
    );
  }

  const envelope = json as { data?: unknown; meta?: M };
  const parsed = schema.safeParse(envelope.data);
  if (!parsed.success) {
    throw new ApiError("The server sent data in an unexpected format.", 502, "invalid_payload");
  }
  return { data: parsed.data, meta: envelope.meta };
}

export function apiGet<T, M = unknown>(url: string, schema: ZodType<T>, signal?: AbortSignal) {
  return request<T, M>(url, schema, signal);
}

/** POST / PUT / PATCH / DELETE with an optional JSON body. */
export function apiSend<T, M = unknown>(
  method: "POST" | "PUT" | "PATCH" | "DELETE",
  url: string,
  schema: ZodType<T>,
  body?: unknown,
) {
  return request<T, M>(url, schema, undefined, { method, body });
}
