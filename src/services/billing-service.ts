/**
 * Plans & billing backed by MongoDB and Razorpay Standard Checkout. The server owns prices and
 * dates: the browser only shows what these functions return. Paying for Pro is a one-time payment
 * for a period (a month or a year); paying again adds another period after the current one.
 * Collections:
 * - billing_orders: one per Razorpay order we create (status created -> paid).
 * - subscriptions: one per user ({ _id: userId }) with the period Pro currently runs until.
 * - billing_payments: one per successful payment (the invoice list).
 * - coupons: { _id: "DIWALI26", label, percentOff, active, expiresAt? }. Create these by hand.
 */
import { BILLING_CURRENCY, GST_PERCENT, PLANS, type BillingInterval } from "@/constants/billing";
import type { Billing, CheckoutSession, SubscriptionInfo } from "@/features/billing/schemas";
import { getDb, isDuplicateKey } from "@/lib/mongo";
import {
  RazorpayError,
  capturePayment,
  createOrder,
  describePaymentMethod,
  fetchPayment,
  isRazorpayConfigured,
  razorpayKeyId,
  verifyPaymentSignature,
  type RzpPayment,
} from "@/lib/razorpay";
import { randomBytes } from "node:crypto";
import { recordPayment } from "./admin-sync";
import { clearEntitlements } from "./entitlements-service";
import { BillingError } from "./billing-errors";
import { adminPlans, getQuote, paise, yearlySave } from "./billing-pricing";
import { notifyPurchase } from "./notification-events";

const MIN_AMOUNT_PAISE = 100;

type OrderDoc = {
  _id: string;
  userId: string;
  interval: BillingInterval;
  basePaise: number;
  gstPaise: number;
  discountPaise: number;
  amountPaise: number;
  couponCode?: string;
  status: "created" | "paid";
  createdAt: Date;
  paidAt?: Date;
  paymentId?: string;
};
type SubscriptionDoc = {
  _id: string;
  interval: BillingInterval;
  currentStart: Date;
  currentEnd: Date;
  lastAmountPaise: number;
  paymentMethod?: string;
  updatedAt: Date;
};
type PaymentDoc = {
  _id: string;
  userId: string;
  orderId: string;
  amountPaise: number;
  method: string;
  description: string;
  paidAt: Date;
};

async function cols() {
  const db = await getDb();
  return {
    orders: db.collection<OrderDoc>("billing_orders"),
    subs: db.collection<SubscriptionDoc>("subscriptions"),
    payments: db.collection<PaymentDoc>("billing_payments"),
  };
}

const description = (i: BillingInterval) => `Pro · ${i === "yearly" ? "Yearly" : "Monthly"}`;

/** `date` plus one calendar month or year (clamped to the end of shorter months). */
function addPeriod(date: Date, interval: BillingInterval): Date {
  const months = interval === "yearly" ? 12 : 1;
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + months;
  const last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  return new Date(
    Date.UTC(y, m, Math.min(date.getUTCDate(), last), date.getUTCHours(), date.getUTCMinutes()),
  );
}

// ---- Reading ----

/** The user's Pro period, if it hasn't run out. */
async function activePeriod(userId: string, now = new Date()) {
  const { subs } = await cols();
  return subs.findOne({ _id: userId, currentEnd: { $gt: now } });
}

function toInfo(sub: SubscriptionDoc | null): SubscriptionInfo {
  if (!sub) {
    return {
      planId: "starter",
      planName: PLANS.starter.name,
      interval: null,
      status: "free",
      amountPaise: null,
      endsOn: null,
      paymentMethod: null,
    };
  }
  return {
    planId: "pro",
    planName: PLANS.pro.name,
    interval: sub.interval,
    status: "active",
    amountPaise: sub.lastAmountPaise,
    endsOn: sub.currentEnd.toISOString(),
    paymentMethod: sub.paymentMethod ?? null,
  };
}

export async function getBilling(userId: string, now = new Date()): Promise<Billing> {
  const { payments } = await cols();
  const [sub, paid, livePlans] = await Promise.all([
    activePeriod(userId, now),
    payments.find({ userId }).sort({ paidAt: -1 }).limit(50).toArray(),
    adminPlans(),
  ]);
  const gst = livePlans.find((p) => p.key === "pro")?.gstPct ?? GST_PERCENT;
  return {
    configured: isRazorpayConfigured(),
    currency: BILLING_CURRENCY,
    gstPercent: gst,
    yearlySavePercent: yearlySave(livePlans),
    plans: [...livePlans]
      .sort((a, b) => (a.monthly ?? 0) - (b.monthly ?? 0))
      .map((p) => ({
        id: p.key as "starter" | "pro",
        name: p.name,
        features: p.features,
        monthlyPaise: paise(p.monthly),
        yearlyPaise: paise(p.yearly),
      })),
    subscription: toInfo(sub),
    invoices: paid.map((p) => ({
      id: p._id,
      date: p.paidAt.toISOString(),
      description: p.description,
      amountPaise: p.amountPaise,
      method: p.method,
      status: "paid" as const,
    })),
  };
}

export async function getPlanName(userId: string): Promise<string> {
  return (await activePeriod(userId)) ? PLANS.pro.name : PLANS.starter.name;
}

/** When Pro runs out, if the user is on it (for the "ending soon" reminder). */
export async function getPlanEnd(userId: string): Promise<Date | null> {
  return (await activePeriod(userId))?.currentEnd ?? null;
}

// ---- Checkout ----

/** Step 1: creates a Razorpay order for the chosen period and returns what Checkout needs. */
export async function startCheckout(
  userId: string,
  user: { name: string; email: string },
  interval: BillingInterval,
  couponCode?: string,
): Promise<CheckoutSession> {
  const quote = await getQuote(interval, couponCode, userId);
  if (quote.totalPaise < MIN_AMOUNT_PAISE) {
    throw new BillingError("The amount is too small to charge.", "unavailable");
  }
  const order = await createOrder({
    amountPaise: quote.totalPaise,
    receipt: `kanaku_${randomBytes(6).toString("hex")}`,
    notes: {
      userId,
      plan: "pro",
      interval,
      ...(quote.coupon ? { coupon: quote.coupon.code } : {}),
    },
  });
  const { orders } = await cols();
  await orders.insertOne({
    _id: order.id,
    userId,
    interval,
    basePaise: quote.basePaise,
    gstPaise: quote.gstPaise,
    discountPaise: quote.discountPaise,
    amountPaise: quote.totalPaise,
    couponCode: quote.coupon?.code,
    status: "created",
    createdAt: new Date(),
  });
  return {
    keyId: razorpayKeyId(),
    orderId: order.id,
    amountPaise: quote.totalPaise,
    description: description(interval),
    prefill: user,
  };
}

async function safely<T>(promise: Promise<T>): Promise<T | null> {
  try {
    return await promise;
  } catch (error) {
    console.error(
      "[billing] Razorpay lookup failed:",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}

/**
 * Marks an order paid exactly once and extends the user's Pro period. Safe to call twice (the
 * browser and the webhook both do): only the first call changes anything.
 */
async function applyPaidOrder(orderId: string, paymentId: string, payment: RzpPayment | null) {
  const { orders, subs, payments } = await cols();
  const now = new Date();
  const order = await orders.findOneAndUpdate(
    { _id: orderId, status: "created" },
    { $set: { status: "paid", paidAt: now, paymentId } },
    { returnDocument: "after" },
  );
  if (!order) return;

  const method = payment ? describePaymentMethod(payment) : "Razorpay";
  // A payment made while Pro is active adds its period after the current one.
  const current = await activePeriod(order.userId, now);
  const start = current ? current.currentEnd : now;
  const endsOn = addPeriod(start, order.interval);
  await subs.updateOne(
    { _id: order.userId },
    {
      $set: {
        interval: order.interval,
        currentStart: start,
        currentEnd: endsOn,
        lastAmountPaise: order.amountPaise,
        paymentMethod: method,
        updatedAt: now,
      },
    },
    { upsert: true },
  );
  // Keep the original start when extending, so only the end moves.
  if (current)
    await subs.updateOne({ _id: order.userId }, { $set: { currentStart: current.currentStart } });

  await payments
    .insertOne({
      _id: paymentId,
      userId: order.userId,
      orderId,
      amountPaise: order.amountPaise,
      method,
      description: description(order.interval),
      paidAt: now,
    })
    .catch((e) => {
      if (!isDuplicateKey(e)) throw e;
    });

  clearEntitlements(); // the new plan's modules apply at once

  // Report the payment to the Admin Portal (revenue, invoices, coupon usage) and refresh the user's plan there.
  recordPayment({
    id: paymentId,
    userId: order.userId,
    plan: description(order.interval),
    amountPaise: order.amountPaise,
    method,
    couponCode: order.couponCode,
  });

  // Tell the user about the purchase (and e-mail the receipt).
  await notifyPurchase(order.userId, {
    paymentId,
    interval: order.interval,
    amountPaise: order.amountPaise,
    discountPaise: order.discountPaise,
    couponCode: order.couponCode,
    endsOn,
    method,
  });
}

/** Step 3: verifies the signature Checkout returned, then activates the plan. */
export async function confirmPayment(
  userId: string,
  input: { orderId: string; paymentId: string; signature: string },
): Promise<void> {
  if (!verifyPaymentSignature(input)) {
    throw new BillingError("We couldn't verify that payment.", "invalid_signature");
  }
  const { orders } = await cols();
  const order = await orders.findOne({ _id: input.orderId, userId });
  if (!order) throw new BillingError("We couldn't find that order.", "not_found");

  let payment = await safely(fetchPayment(input.paymentId));
  if (payment?.status === "authorized") {
    payment = (await safely(capturePayment(payment.id, order.amountPaise))) ?? payment;
  }
  if (payment && (payment.order_id !== order._id || payment.amount !== order.amountPaise)) {
    throw new BillingError("That payment doesn't match the order.", "invalid_signature");
  }
  await applyPaidOrder(order._id, input.paymentId, payment);
}

// ---- Webhooks ----

type WebhookPayload = {
  event: string;
  payload?: { payment?: { entity?: RzpPayment } };
};

/** Razorpay's own notification that an order was paid; covers the browser closing early. */
export async function handleWebhook(body: WebhookPayload): Promise<string> {
  const payment = body.payload?.payment?.entity;
  if (!payment?.order_id || !["payment.captured", "order.paid"].includes(body.event))
    return "ignored";
  const { orders } = await cols();
  const order = await orders.findOne({ _id: payment.order_id });
  if (!order || order.amountPaise !== payment.amount) return "unknown order";
  await applyPaidOrder(order._id, payment.id, payment);
  return "updated";
}

export { RazorpayError };

export { BillingError, getQuote };
export { listOffers } from "./billing-pricing";
