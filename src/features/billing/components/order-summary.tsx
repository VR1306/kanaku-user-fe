"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FOCUS_FIELD } from "@/constants/styles";
import { cn } from "@/utils/cn";
import { formatCurrency } from "@/utils/format";
import type { Quote } from "../schemas";

type Props = {
  quote?: Quote;
  currency: string;
  couponError?: string;
  applying: boolean;
  /** Called with the typed code, or "" to remove the coupon. */
  onApplyCoupon: (code: string) => void;
  action: React.ReactNode;
  disabledNote?: string;
};

const line = "flex items-center justify-between gap-4 text-[15px]";

/** Price, GST, coupon and the total, all from the API's quote. */
export function OrderSummary({
  quote,
  currency,
  couponError,
  applying,
  onApplyCoupon,
  action,
  disabledNote,
}: Props) {
  const [code, setCode] = useState("");
  const money = (paise: number) => formatCurrency(paise / 100, currency);
  const label = quote ? `Pro · ${quote.interval === "yearly" ? "Yearly" : "Monthly"}` : "Pro";

  return (
    <section
      aria-label="Order summary"
      className="rounded-[24px] border border-line bg-surface p-[29px]"
    >
      <h2 className="font-display text-xl font-bold text-ink">Order summary</h2>
      <div className="mt-5 flex flex-col gap-3">
        <p className={line}>
          <span className="text-muted">{label}</span>
          <span className="font-semibold text-ink">{quote ? money(quote.basePaise) : "—"}</span>
        </p>
        <p className={line}>
          <span className="text-muted">GST ({quote?.gstPercent ?? 18}%)</span>
          <span className="font-semibold text-ink">{quote ? money(quote.gstPaise) : "—"}</span>
        </p>
        {quote && quote.discountPaise > 0 ? (
          <p className={cn(line, "text-success")}>
            <span>
              Coupon {quote.coupon?.code} ({quote.coupon?.percentOff}% off)
            </span>
            <span className="font-semibold">−{money(quote.discountPaise)}</span>
          </p>
        ) : null}
      </div>

      <form
        className="mt-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (quote?.coupon) {
            setCode("");
            onApplyCoupon("");
          } else if (code.trim()) onApplyCoupon(code.trim());
        }}
      >
        <label htmlFor="coupon" className="mb-2 block text-sm font-bold text-ink">
          Coupon code
        </label>
        <div className="flex gap-2">
          <input
            id="coupon"
            value={quote?.coupon ? quote.coupon.code : code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            readOnly={Boolean(quote?.coupon)}
            placeholder="Enter a coupon code"
            autoComplete="off"
            aria-invalid={couponError ? true : undefined}
            className={cn(
              "h-[54px] min-w-0 flex-1 rounded-control border bg-surface px-4 text-[15px] text-ink placeholder:text-subtle read-only:bg-page",
              couponError ? "border-danger" : "border-line-strong",
              FOCUS_FIELD,
            )}
          />
          <Button
            type="submit"
            variant="outline"
            className="h-[54px] shrink-0 px-5"
            loading={applying}
          >
            <span className="text-link">{quote?.coupon ? "Remove" : "Apply"}</span>
          </Button>
        </div>
        {couponError ? (
          <p role="alert" className="mt-2 text-sm text-danger">
            {couponError}
          </p>
        ) : quote?.coupon ? (
          <p className="mt-2 text-sm text-success">{quote.coupon.label}</p>
        ) : null}
      </form>

      <div className="mt-6 flex items-center justify-between border-t border-line-soft pt-5">
        <span className="text-base font-bold text-ink">Total today</span>
        <span className="font-display text-[26px] font-extrabold text-ink">
          {quote ? money(quote.totalPaise) : "—"}
        </span>
      </div>

      <div className="mt-6">{action}</div>
      <p className="mt-4 text-center text-[13px] text-muted">
        {disabledNote ??
          "UPI, cards and net banking via Razorpay · One-time payment, no auto-renewal"}
      </p>
    </section>
  );
}
