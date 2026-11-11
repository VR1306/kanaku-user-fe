import { apiError, apiOk } from "@/lib/api-response";
import { getSession } from "@/lib/session";
import { getBilling } from "@/services/billing-service";

/** GET /api/billing : plans and prices, the current subscription and the invoice list. */
export async function GET() {
  const session = await getSession();
  if (!session) return apiError(401, "unauthenticated", "Please log in to continue.");
  return apiOk(await getBilling(session.id), { source: "database" });
}
