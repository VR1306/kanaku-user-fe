import type { NextRequest } from "next/server";
import { quoteQuerySchema } from "@/features/billing/schemas";
import { apiError, apiOk } from "@/lib/api-response";
import { billingFailure } from "@/lib/billing-response";
import { getSession } from "@/lib/session";
import { getQuote } from "@/services/billing-service";

/** GET /api/billing/quote?interval=monthly|yearly&coupon= : the order summary for Pro. */
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return apiError(401, "unauthenticated", "Please log in to continue.");
  const p = request.nextUrl.searchParams;
  const parsed = quoteQuerySchema.safeParse({
    interval: p.get("interval") ?? undefined,
    coupon: p.get("coupon") || undefined,
  });
  if (!parsed.success) return apiError(400, "invalid_query", "Choose monthly or yearly billing.");
  try {
    return apiOk(await getQuote(parsed.data.interval, parsed.data.coupon), { source: "database" });
  } catch (error) {
    return billingFailure(error);
  }
}
