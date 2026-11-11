import type { NextRequest } from "next/server";
import { quoteQuerySchema } from "@/features/billing/schemas";
import { apiError, apiOk } from "@/lib/api-response";
import { billingFailure } from "@/lib/billing-response";
import { isRazorpayConfigured } from "@/lib/razorpay";
import { isSameOrigin } from "@/lib/same-origin";
import { getSession } from "@/lib/session";
import { startCheckout } from "@/services/billing-service";

/** POST /api/billing/checkout  body: { interval, coupon? } : creates the Razorpay order. */
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return apiError(403, "forbidden", "Request blocked.");
  const session = await getSession();
  if (!session) return apiError(401, "unauthenticated", "Please log in to continue.");
  if (!isRazorpayConfigured()) return apiError(503, "unavailable", "Payments aren't set up yet.");

  const body = quoteQuerySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return apiError(400, "invalid_body", "Choose monthly or yearly billing.");
  try {
    return apiOk(
      await startCheckout(
        session.id,
        { name: session.name, email: session.email },
        body.data.interval,
        body.data.coupon,
      ),
      { source: "database" },
      201,
    );
  } catch (error) {
    return billingFailure(error);
  }
}
