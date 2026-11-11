import { apiError } from "@/lib/api-response";
import { BillingError } from "@/services/billing-service";
import { RazorpayError } from "@/lib/razorpay";

/** Turns billing and Razorpay failures into the app's standard error response. */
export function billingFailure(error: unknown): Response {
  if (error instanceof BillingError) {
    const status = error.code === "invalid_coupon" || error.code === "not_found" ? 404 : 400;
    return apiError(status, error.code, error.message);
  }
  if (error instanceof RazorpayError) {
    return error.status === 503
      ? apiError(503, "unavailable", error.message)
      : apiError(502, "payment_provider", error.message);
  }
  throw error;
}
