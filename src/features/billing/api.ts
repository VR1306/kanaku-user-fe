import { z } from "zod";
import { API_ROUTES } from "@/constants/api";
import type { BillingInterval } from "@/constants/billing";
import { apiGet, apiSend } from "@/services/api-client";
import { billingSchema, checkoutSchema, offersSchema, quoteSchema } from "./schemas";

const ok = z.object({ ok: z.literal(true) });
const base = API_ROUTES.billing;

export const fetchBilling = (signal?: AbortSignal) => apiGet(base, billingSchema, signal);

export const fetchQuote = (interval: BillingInterval, coupon?: string, signal?: AbortSignal) =>
  apiGet(
    `${base}/quote?interval=${interval}${coupon ? `&coupon=${encodeURIComponent(coupon)}` : ""}`,
    quoteSchema,
    signal,
  );

export const startCheckout = (interval: BillingInterval, coupon?: string) =>
  apiSend("POST", `${base}/checkout`, checkoutSchema, { interval, coupon });

export const verifyPayment = (input: {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}) => apiSend("POST", `${base}/verify`, ok, input);

export const fetchOffers = (interval: BillingInterval, signal?: AbortSignal) =>
  apiGet(`${base}/coupons?interval=${interval}`, offersSchema, signal);
