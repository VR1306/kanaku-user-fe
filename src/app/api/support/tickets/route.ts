import type { NextRequest } from "next/server";
import { newTicketSchema } from "@/features/help/schemas";
import { apiError, apiOk } from "@/lib/api-response";
import { isSameOrigin } from "@/lib/same-origin";
import { getSession } from "@/lib/session";
import { createTicket, listTickets } from "@/services/tickets-service";

/** GET /api/support/tickets : the signed-in user's tickets, most recently active first. */
export async function GET() {
  const session = await getSession();
  if (!session) return apiError(401, "unauthenticated", "Please log in to continue.");
  return apiOk({ items: await listTickets(session.id) }, { source: "database" });
}

/** POST /api/support/tickets : open a ticket. */
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return apiError(403, "forbidden", "Request blocked.");
  const session = await getSession();
  if (!session) return apiError(401, "unauthenticated", "Please log in to continue.");
  const body = newTicketSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return apiError(400, "invalid_body", body.error.issues[0]?.message ?? "Invalid request.");
  }
  return apiOk(await createTicket(session.id, body.data), { source: "database" }, 201);
}
