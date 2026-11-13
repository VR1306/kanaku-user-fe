import type { NextRequest } from "next/server";
import { replySchema } from "@/features/help/schemas";
import { apiError, apiOk } from "@/lib/api-response";
import { isSameOrigin } from "@/lib/same-origin";
import { getSession } from "@/lib/session";
import { replyToTicket, TicketLockedError } from "@/services/tickets-service";

/** POST /api/support/tickets/:id/messages : add a reply. Refused (409) once the ticket is resolved. */
export async function POST(
  request: NextRequest,
  ctx: RouteContext<"/api/support/tickets/[id]/messages">,
) {
  if (!isSameOrigin(request)) return apiError(403, "forbidden", "Request blocked.");
  const session = await getSession();
  if (!session) return apiError(401, "unauthenticated", "Please log in to continue.");
  const body = replySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return apiError(400, "invalid_body", body.error.issues[0]?.message ?? "Invalid reply.");
  }
  const { id } = await ctx.params;
  let ticket;
  try {
    ticket = await replyToTicket(session.id, id, body.data);
  } catch (error) {
    if (error instanceof TicketLockedError) return apiError(409, "resolved", error.message);
    throw error;
  }
  return ticket
    ? apiOk(ticket, { source: "database" })
    : apiError(404, "not_found", "We couldn't find that ticket.");
}
