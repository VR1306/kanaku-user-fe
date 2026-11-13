/**
 * Pro pricing and coupons. The Admin Portal owns plans, prices, GST and coupons: this file reads them (cached, with
 * stale-while-revalidate) and prices an order from them. The browser never sets a price.
 */
import { YEARLY_SAVE_PERCENT, type BillingInterval } from "@/constants/billing";
import type { Quote } from "@/features/billing/schemas";
import { adminFetch, cachedFetch } from "@/lib/admin-api";
import { getDb } from "@/lib/mongo";
import { BillingError } from "./billing-errors";

// ---- Pricing (owned by the Admin Portal) ----

export type AdminPlan = {
  key: string;
  name: string;
  features: string[];
  monthly: number | null;
  yearly: number | null;
  gstPct: number;
  /** Modules this plan includes and its budget allowance (set in the Admin Portal). */
  modules?: string[];
  maxBudgets?: number | null;
};

/** Live plans from the Admin Portal; the last good copy is served during a brief outage. */
export const adminPlans = cachedFetch<AdminPlan[]>(
  30_000,
  () => adminFetch<AdminPlan[]>("/api/v1/public/plans"),
  () => {
    // No hardcoded prices: if the Admin Portal was never reachable, say so instead of showing wrong amounts.
    throw new BillingError(
      "Plans are temporarily unavailable. Please try again shortly.",
      "unavailable",
    );
  },
);

async function proPlan(): Promise<AdminPlan> {
  const found = (await adminPlans()).find((p) => p.key === "pro");
  if (!found) throw new BillingError("Pro isn't available right now.", "unavailable");
  return found;
}
export const paise = (rupees: number | null) => Math.round((rupees ?? 0) * 100);
export const yearlySave = (plans: AdminPlan[]) => {
  const pro = plans.find((p) => p.key === "pro");
  return pro?.monthly && pro.yearly
    ? Math.max(0, Math.round(100 - (pro.yearly / (pro.monthly * 12)) * 100))
    : YEARLY_SAVE_PERCENT;
};

type CouponCheck =
  | { valid: false; reason: string | null }
  | {
      valid: true;
      code: string;
      type: "percent" | "fixed";
      value: number;
      discount: number;
      /** How many times one customer may use it (the Admin Portal's rule). */
      perUser: number;
    };

/**
 * How many times this customer has already paid with this coupon here. The Admin Portal counts uses too, but it
 * learns about a payment a moment after it happens; checking our own paid orders closes that gap, so a coupon
 * can't be reapplied straight after using it.
 */
async function paidUsesHere(userId: string, code: string): Promise<number> {
  const orders = (await getDb()).collection<{
    userId: string;
    status: string;
    couponCode?: string;
  }>("billing_orders");
  return orders.countDocuments({
    userId,
    status: "paid",
    couponCode: { $regex: `^${code.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
  });
}

/** Coupons are created and validated by the Admin Portal; this app never stores or edits them. */
async function checkCoupon(
  code: string,
  interval: BillingInterval,
  userId: string,
): Promise<CouponCheck> {
  try {
    const result = await adminFetch<CouponCheck>("/api/v1/service/coupons/validate", {
      method: "POST",
      service: true,
      body: { code: code.trim(), plan: "pro", interval, userId },
    });
    if (result.valid && (await paidUsesHere(userId, result.code)) >= result.perUser)
      return {
        valid: false,
        reason:
          result.perUser > 1
            ? `You have already used this coupon the maximum number of times (${result.perUser})`
            : "You have already used this coupon",
      };
    return result;
  } catch {
    throw new BillingError(
      "We couldn't check that coupon right now. Please try again.",
      "unavailable",
    );
  }
}

export async function getQuote(
  interval: BillingInterval,
  couponCode: string | undefined,
  userId: string,
): Promise<Quote> {
  const plan = await proPlan();
  const basePaise = paise(interval === "yearly" ? plan.yearly : plan.monthly);
  let coupon: Quote["coupon"] = null;
  let discountPaise = 0;
  if (couponCode) {
    const c = await checkCoupon(couponCode, interval, userId);
    if (!c.valid)
      throw new BillingError(c.reason ?? "That coupon code isn't valid.", "invalid_coupon");
    discountPaise = Math.min(basePaise, paise(c.discount));
    coupon = {
      code: c.code,
      label: c.type === "percent" ? `${c.value}% off` : `₹${c.value} off`,
      percentOff:
        c.type === "percent" ? c.value : Math.round((discountPaise / Math.max(basePaise, 1)) * 100),
    };
  }
  // GST is charged on the discounted price.
  const gstPaise = Math.round(((basePaise - discountPaise) * plan.gstPct) / 100);
  return {
    planId: "pro",
    interval,
    basePaise,
    gstPercent: plan.gstPct,
    gstPaise,
    discountPaise,
    totalPaise: basePaise - discountPaise + gstPaise,
    coupon,
  };
}

/** Coupons the admin chose to show at checkout (empty if the Admin Portal can't be reached). */
export async function listOffers(interval: BillingInterval, userId: string) {
  try {
    const all = await adminFetch<
      Array<{
        code: string;
        label: string;
        validUntil?: string;
        discount: number;
        perUser?: number;
      }>
    >(
      `/api/v1/service/coupons?plan=pro&interval=${interval}&userId=${encodeURIComponent(userId)}`,
      {
        service: true,
      },
    );
    // The Admin Portal already hides coupons this customer used; also hide ones they just paid with here.
    const used = await Promise.all(all.map((r) => paidUsesHere(userId, r.code)));
    const rows = all.filter((r, i) => used[i] < (r.perUser ?? 1));
    return rows.map((r) => ({
      code: r.code,
      label: r.label,
      validUntil: r.validUntil ?? null,
      discount: r.discount,
    }));
  } catch {
    return [];
  }
}
