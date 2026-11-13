"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { type BillingInterval } from "@/constants/billing";
import { ApiError } from "@/services/api-client";
import { fetchOffers, fetchQuote, startCheckout, verifyPayment } from "../api";
import { openCheckout } from "../razorpay-checkout";
import type { Billing, Offer, Quote } from "../schemas";
import { OrderSummary } from "./order-summary";
import { PlanCard } from "./plan-cards";

/**
 * Upgrade to Pro (or add another period) inside Settings > Plan & billing: choose monthly
 * or yearly, review the order, and pay with Razorpay. Prices and totals come from the API.
 */
const NOT_CONFIGURED =
  "Online payments aren't switched on yet. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env.local on the server and restart it.";

export function CheckoutPanel({
  billing,
  onClose,
  onDone,
}: {
  billing: Billing;
  /** Back to the plan overview without changing anything. */
  onClose: () => void;
  /** A payment went through. */
  onDone: () => void;
}) {
  const [interval, setInterval_] = useState<BillingInterval>("yearly");
  const [coupon, setCoupon] = useState<string>();
  const [quote, setQuote] = useState<Quote>();
  const [offerState, setOfferState] = useState<{ interval: BillingInterval; items: Offer[] }>();
  // Offers belong to a billing period; until the new period's list arrives show nothing (not the old period's).
  const offers: Offer[] | undefined =
    offerState?.interval === interval ? offerState.items : undefined;
  const [couponError, setCouponError] = useState<string>();
  const [applying, setApplying] = useState(false);
  const [paying, setPaying] = useState(false);
  const [message, setMessage] = useState<string>();

  const sub = billing.subscription;
  const isPaid = sub?.status === "active";

  // Coupons the Kanaku team lists for this billing period (managed in the admin).
  useEffect(() => {
    const controller = new AbortController();
    fetchOffers(interval, controller.signal)
      .then(({ data }) => setOfferState({ interval, items: data.items }))
      .catch(() => setOfferState({ interval, items: [] }));
    return () => controller.abort();
  }, [interval]);

  useEffect(() => {
    const controller = new AbortController();
    fetchQuote(interval, coupon, controller.signal)
      .then(({ data }) => {
        setQuote(data);
        setCouponError(undefined);
      })
      .catch((e: unknown) => {
        if (controller.signal.aborted) return;
        if (e instanceof ApiError && e.code === "invalid_coupon") {
          setCouponError(e.message);
          setCoupon(undefined); // fall back to the full price
        } else setMessage(e instanceof Error ? e.message : "Couldn't price your order.");
      })
      .finally(() => setApplying(false));
    return () => controller.abort();
  }, [interval, coupon]);

  async function pay() {
    setMessage(undefined);
    if (!billing.configured) {
      setMessage(NOT_CONFIGURED);
      return;
    }
    setPaying(true);
    try {
      const session = await startCheckout(interval, coupon);
      const outcome = await openCheckout(session.data);
      if (outcome.status === "paid") {
        await verifyPayment(outcome.response);
        onDone();
        return;
      }
      if (outcome.status === "failed") setMessage(outcome.message);
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : "Something went wrong. You haven't been charged.",
      );
    } finally {
      setPaying(false);
    }
  }

  const description = isPaid
    ? "Add another period. It starts when your current plan ends."
    : "Unlock unlimited budgets, receipt vault and smart alerts";

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-semibold text-link hover:underline"
          >
            ← Back to plan
          </button>
          <p className="mt-2 text-[15px] text-muted">{description}</p>
        </div>
        <SegmentedControl
          aria-label="Billing period"
          options={[
            { value: "monthly", label: "Monthly" },
            { value: "yearly", label: `Yearly · save ${billing.yearlySavePercent}%` },
          ]}
          value={interval}
          onChange={(v) => setInterval_(v)}
        />
      </div>

      {!billing.configured ? (
        <p
          role="status"
          className="mt-5 rounded-control bg-accent-tint px-4 py-3 text-sm text-accent-deep"
        >
          {NOT_CONFIGURED}
        </p>
      ) : null}

      <div className="mt-6 grid items-stretch gap-5 sm:grid-cols-2">
        {billing.plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            interval={interval}
            currency={billing.currency}
            current={(sub?.planId ?? "starter") === plan.id}
            selected={plan.id === "pro"}
          />
        ))}
      </div>

      <div className="mt-5">
        <OrderSummary
          quote={quote}
          currency={billing.currency}
          couponError={couponError}
          offers={offers}
          intervalLabel={interval}
          applying={applying}
          onApplyCoupon={(code) => {
            setApplying(true);
            setCouponError(undefined);
            setCoupon(code || undefined);
          }}
          action={
            <>
              <Button size="lg" fullWidth onClick={() => void pay()} loading={paying}>
                Pay securely
              </Button>
              {message ? (
                <p
                  role="alert"
                  className="mt-3 rounded-control bg-danger-tint px-4 py-3 text-sm text-danger"
                >
                  {message}
                </p>
              ) : null}
            </>
          }
        />
      </div>
    </div>
  );
}
