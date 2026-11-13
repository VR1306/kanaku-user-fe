import { moduleBlocked } from "@/lib/module-guard";
import type { NextRequest } from "next/server";
import { apiError, apiOk } from "@/lib/api-response";
import { isSameOrigin } from "@/lib/same-origin";
import { getSession } from "@/lib/session";
import { markRead } from "@/services/notifications-service";

/** PATCH /api/notifications/:id : mark one notification as read. */
export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/notifications/[id]">) {
  if (!isSameOrigin(request)) return apiError(403, "forbidden", "Request blocked.");
  const session = await getSession();
  if (!session) return apiError(401, "unauthenticated", "Please log in to continue.");
  const blocked = await moduleBlocked(session.id, "notifications");
  if (blocked) return blocked;
  const { id } = await ctx.params;
  return (await markRead(session.id, id))
    ? apiOk({ id }, { source: "database" })
    : apiError(404, "not_found", "We couldn't find that notification.");
}
