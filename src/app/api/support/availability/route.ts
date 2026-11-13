import { apiError, apiOk } from "@/lib/api-response";
import { getSession } from "@/lib/session";
import { getAvailability } from "@/services/tickets-service";

/** GET /api/support/availability : is a support agent online for live chat right now? */
export async function GET() {
  const session = await getSession();
  if (!session) return apiError(401, "unauthenticated", "Please log in to continue.");
  return apiOk(await getAvailability(), { source: "database" });
}
