import { z } from "zod";
import { BILLING_INTERVALS, PLAN_IDS } from "@/constants/billing";

const planId = z.enum(PLAN_IDS);
const interval = z.enum(BILLING_INTERVALS);

export const planSchema = z.object({
  id: planId,
  name: z.string(),
  features: z.array(z.string()),
  /** Price per billing period in paise, before GST. */
  monthlyPaise: z.number().int(),
  yearlyPaise: z.number().int(),
});
export type PlanInfo = z.infer<typeof planSchema>;

export const subscriptionInfoSchema = z.object({
  planId,
  planName: z.string(),
  /** The period of the last payment. */
  interval: interval.nullable(),
  /** "free": no paid plan. "active": Pro until `endsOn`. */
  status: z.enum(["free", "active"]),
  /** What the last payment cost in paise, GST included. */
  amountPaise: z.number().int().nullable(),
  /** ISO date Pro runs until. Paying again adds another period after it. */
  endsOn: z.string().nullable(),
  paymentMethod: z.string().nullable(),
});
export type SubscriptionInfo = z.infer<typeof subscriptionInfoSchema>;

export const invoiceSchema = z.object({
  id: z.string(),
  date: z.string(),
  description: z.string(),
  amountPaise: z.number().int(),
  method: z.string(),
  status: z.literal("paid"),
});
export type Invoice = z.infer<typeof invoiceSchema>;

export const billingSchema = z.object({
  /** False until Razorpay keys are set on the server. */
  configured: z.boolean(),
  currency: z.string().length(3),
  gstPercent: z.number(),
  yearlySavePercent: z.number(),
  plans: z.array(planSchema),
  subscription: subscriptionInfoSchema,
  invoices: z.array(invoiceSchema),
});
export type Billing = z.infer<typeof billingSchema>;

export const quoteSchema = z.object({
  planId,
  interval,
  basePaise: z.number().int(),
  gstPercent: z.number(),
  gstPaise: z.number().int(),
  discountPaise: z.number().int(),
  totalPaise: z.number().int(),
  coupon: z.object({ code: z.string(), label: z.string(), percentOff: z.number() }).nullable(),
});
export type Quote = z.infer<typeof quoteSchema>;

export const quoteQuerySchema = z.object({
  interval,
  coupon: z.string().trim().max(30).optional(),
});

/** What the browser needs to open Razorpay Checkout for an order. */
export const checkoutSchema = z.object({
  keyId: z.string(),
  orderId: z.string(),
  amountPaise: z.number().int(),
  description: z.string(),
  prefill: z.object({ name: z.string(), email: z.string() }),
});
export type CheckoutSession = z.infer<typeof checkoutSchema>;

export const verifySchema = z.object({
  razorpay_payment_id: z.string().min(1),
  razorpay_order_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});
