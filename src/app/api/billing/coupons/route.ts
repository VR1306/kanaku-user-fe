import type { NextRequest } from "next/server";
import { quoteQuerySchema } from "@/features/billing/schemas";
import { apiError, apiOk } from "@/lib/api-response";
import { getSession } from "@/lib/session";
import { listOffers } from "@/services/billing-service";

/** GET /api/billing/coupons?interval=monthly|yearly : coupons the Kanaku team lists for checkout (managed in the admin). */
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return apiError(401, "unauthenticated", "Please log in to continue.");
  const parsed = quoteQuerySchema.pick({ interval: true }).safeParse({
    interval: request.nextUrl.searchParams.get("interval") ?? undefined,
  });
  if (!parsed.success) return apiError(400, "invalid_query", "Choose monthly or yearly billing.");
  return apiOk(
    { items: await listOffers(parsed.data.interval, session.id) },
    { source: "database" },
  );
}
