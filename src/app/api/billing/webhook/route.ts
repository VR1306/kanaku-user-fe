import type { NextRequest } from "next/server";
import { apiError, apiOk } from "@/lib/api-response";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { handleWebhook } from "@/services/billing-service";

/**
 * POST /api/billing/webhook : called by Razorpay (not the browser), so it has no session.
 * Trust comes from the X-Razorpay-Signature header, checked against RAZORPAY_WEBHOOK_SECRET.
 */
export async function POST(request: NextRequest) {
  const raw = await request.text();
  if (!verifyWebhookSignature(raw, request.headers.get("x-razorpay-signature"))) {
    return apiError(400, "invalid_signature", "Signature check failed.");
  }
  let body: Parameters<typeof handleWebhook>[0];
  try {
    body = JSON.parse(raw);
  } catch {
    return apiError(400, "invalid_body", "Invalid JSON.");
  }
  return apiOk({ result: await handleWebhook(body) }, { source: "database" });
}
