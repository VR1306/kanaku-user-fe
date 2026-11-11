import type { NextRequest } from "next/server";
import { verifySchema } from "@/features/billing/schemas";
import { apiError, apiOk } from "@/lib/api-response";
import { billingFailure } from "@/lib/billing-response";
import { isSameOrigin } from "@/lib/same-origin";
import { getSession } from "@/lib/session";
import { confirmPayment } from "@/services/billing-service";

/** POST /api/billing/verify : checks Razorpay's signature after Checkout, then activates the plan. */
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return apiError(403, "forbidden", "Request blocked.");
  const session = await getSession();
  if (!session) return apiError(401, "unauthenticated", "Please log in to continue.");
  const body = verifySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return apiError(400, "invalid_body", "Missing payment details.");
  try {
    await confirmPayment(session.id, {
      paymentId: body.data.razorpay_payment_id,
      orderId: body.data.razorpay_order_id,
      signature: body.data.razorpay_signature,
    });
    return apiOk({ ok: true as const }, { source: "database" });
  } catch (error) {
    return billingFailure(error);
  }
}
