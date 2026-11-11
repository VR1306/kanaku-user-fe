import type { NextRequest } from "next/server";
import { apiError, apiOk } from "@/lib/api-response";
import { isSameOrigin } from "@/lib/same-origin";
import { getSession } from "@/lib/session";
import { resolveTicket } from "@/services/tickets-service";

/** POST /api/support/tickets/:id/resolve : the user marks their own ticket as resolved. */
export async function POST(
  request: NextRequest,
  ctx: RouteContext<"/api/support/tickets/[id]/resolve">,
) {
  if (!isSameOrigin(request)) return apiError(403, "forbidden", "Request blocked.");
  const session = await getSession();
  if (!session) return apiError(401, "unauthenticated", "Please log in to continue.");
  const { id } = await ctx.params;
  const ticket = await resolveTicket(session.id, id);
  return ticket
    ? apiOk(ticket, { source: "database" })
    : apiError(404, "not_found", "We couldn't find that ticket.");
}
