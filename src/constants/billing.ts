export const PLAN_IDS = ["starter", "pro"] as const;
export type PlanId = (typeof PLAN_IDS)[number];
export const BILLING_INTERVALS = ["monthly", "yearly"] as const;
export type BillingInterval = (typeof BILLING_INTERVALS)[number];

export const BILLING_CURRENCY = "INR";
/** GST added on top of the plan price. */
export const GST_PERCENT = 18;
/** Yearly is this much cheaper than twelve monthly payments. */
export const YEARLY_SAVE_PERCENT = 20;

/**
 * The plans the server offers. Prices are in paise, before GST. The browser never sets a price:
 * it asks the API (/api/billing, /api/billing/quote) and shows what comes back.
 */
export const PLANS = {
  starter: {
    name: "Starter",
    monthlyPaise: 0,
    features: ["Unlimited transactions", "Up to 5 budgets", "Monthly reports"],
  },
  pro: {
    name: "Pro",
    monthlyPaise: 14_900,
    features: [
      "Everything in Starter",
      "Unlimited budgets & recurring",
      "Receipt vault & PDF exports",
      "Smart alerts",
    ],
  },
} as const satisfies Record<
  PlanId,
  { name: string; monthlyPaise: number; features: readonly string[] }
>;

/** Price of a billing period in paise, before GST. Yearly gets the discount, rounded to a rupee. */
export function planPricePaise(plan: PlanId, interval: BillingInterval): number {
  const monthly = PLANS[plan].monthlyPaise;
  return interval === "monthly"
    ? monthly
    : Math.round((monthly * 12 * (100 - YEARLY_SAVE_PERCENT)) / 100 / 100) * 100;
}

export const INTERVAL_LABEL: Record<BillingInterval, string> = { monthly: "month", yearly: "year" };
