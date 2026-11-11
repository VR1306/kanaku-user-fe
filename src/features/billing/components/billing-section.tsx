"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { INTERVAL_LABEL } from "@/constants/billing";
import { SectionShell } from "@/features/settings/components/section-shell";
import { usePreferences } from "@/features/settings/components/preferences-provider";
import { cn } from "@/utils/cn";
import { formatCurrency } from "@/utils/format";
import { useBilling } from "../hooks/use-billing";
import { CheckoutPanel } from "./checkout-panel";
import { BillingHistoryDrawer } from "./billing-history-drawer";

const row =
  "flex items-center justify-between gap-4 border-b border-line-soft py-[13px] text-[15px]";
const link = "font-semibold text-link underline underline-offset-2 hover:text-brand";

/** Settings > Plan & billing: the current plan, how it's paid for, and the receipts. */
export function BillingSection() {
  const { data, error, reload } = useBilling();
  const { formatDate } = usePreferences();
  const [history, setHistory] = useState(false);
  const [checkout, setCheckout] = useState(false);
  const [justPaid, setJustPaid] = useState(false);
  const router = useRouter();

  if (error && !data) {
    return (
      <SectionShell title="Plan & billing">
        <EmptyState
          icon="help"
          title="We couldn't load your billing details"
          description={error}
          action={<Button onClick={reload}>Try again</Button>}
        />
      </SectionShell>
    );
  }
  if (!data) {
    return (
      <SectionShell title="Plan & billing">
        <Skeleton
          aria-busy="true"
          aria-label="Loading billing"
          className="h-[133px] rounded-[22px]"
        />
      </SectionShell>
    );
  }

  const sub = data.subscription;
  const paid = sub.status !== "free";
  const money = (paise: number) => formatCurrency(paise / 100, data.currency);
  const detail = !paid
    ? "Free forever · upgrade any time"
    : `${sub.amountPaise !== null ? money(sub.amountPaise) : ""} / ${sub.interval ? INTERVAL_LABEL[sub.interval] : ""} · active until ${sub.endsOn ? formatDate(sub.endsOn) : ""}`;

  if (checkout) {
    return (
      <SectionShell title={paid ? "Extend plan" : "Upgrade to Pro"}>
        <CheckoutPanel
          billing={data}
          onClose={() => setCheckout(false)}
          onDone={() => {
            setCheckout(false);
            setJustPaid(true);
            reload(); // this page: plan card, payment method, receipts
            router.refresh(); // the sidebar's plan name and everything else the server renders
          }}
        />
      </SectionShell>
    );
  }

  return (
    <SectionShell title="Plan & billing">
      {justPaid && paid ? (
        <p
          role="status"
          className="mb-4 rounded-control bg-success-tint px-4 py-3 text-sm font-semibold text-success"
        >
          Payment received. You&apos;re on Pro until {sub.endsOn ? formatDate(sub.endsOn) : ""}.
        </p>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-5 rounded-[22px] bg-brand p-[26px] text-on-inverse">
        <div className="min-w-0">
          <p className="text-[13px] tracking-[0.14em] text-accent-pale uppercase">Current plan</p>
          <p className="mt-2 font-display text-[32px] leading-tight font-bold">{sub.planName}</p>
          <p className="mt-1 text-sm text-brand-pale">{detail}</p>
        </div>
        <Button variant="accent" onClick={() => setCheckout(true)}>
          {paid ? "Extend plan" : "Upgrade to Pro"}
        </Button>
      </div>

      <div className="mt-5">
        <div className={row}>
          <span className="text-ink">Payment method</span>
          <span className="flex items-center gap-2 text-right font-semibold text-ink">
            {sub.paymentMethod ?? "None yet"}
          </span>
        </div>
        <div className={row}>
          <span className="text-ink">Invoices</span>
          <button type="button" onClick={() => setHistory(true)} className={cn(link)}>
            View billing history
          </button>
        </div>
      </div>

      <BillingHistoryDrawer
        open={history}
        invoices={data.invoices}
        currency={data.currency}
        onClose={() => setHistory(false)}
      />
    </SectionShell>
  );
}
