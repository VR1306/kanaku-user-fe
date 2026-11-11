import type { NextRequest } from "next/server";
import { apiError, apiOk } from "@/lib/api-response";
import { getSession } from "@/lib/session";
import { getTicket } from "@/services/tickets-service";

/** GET /api/support/tickets/:id : the whole conversation. */
export async function GET(_req: NextRequest, ctx: RouteContext<"/api/support/tickets/[id]">) {
  const session = await getSession();
  if (!session) return apiError(401, "unauthenticated", "Please log in to continue.");
  const { id } = await ctx.params;
  const ticket = await getTicket(session.id, id);
  return ticket
    ? apiOk(ticket, { source: "database" })
    : apiError(404, "not_found", "We couldn't find that ticket.");
}
