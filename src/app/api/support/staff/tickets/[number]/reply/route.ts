import type { NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { staffReplySchema } from "@/features/help/schemas";
import { apiError, apiOk } from "@/lib/api-response";
import { staffReply } from "@/services/tickets-service";

function authorised(request: NextRequest): boolean {
  const key = process.env.SUPPORT_API_KEY;
  const given = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!key || key.length < 16) return false;
  const a = Buffer.from(key);
  const b = Buffer.from(given);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * POST /api/support/staff/tickets/:number/reply  body: { message, status?: "open"|"pending"|"resolved" }
 * For the support team's own tooling. Authenticated with `Authorization: Bearer <SUPPORT_API_KEY>`
 * (set SUPPORT_API_KEY, at least 16 characters, on the server). Not available to signed-in users.
 */
export async function POST(
  request: NextRequest,
  ctx: RouteContext<"/api/support/staff/tickets/[number]/reply">,
) {
  if (!authorised(request)) return apiError(401, "unauthenticated", "Invalid support key.");
  const body = staffReplySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return apiError(400, "invalid_body", "Send { message, status? }.");
  const { number } = await ctx.params;
  const ok = await staffReply(Number(number), body.data);
  return ok
    ? apiOk({ ok: true as const }, { source: "database" })
    : apiError(404, "not_found", "No ticket with that number.");
}
