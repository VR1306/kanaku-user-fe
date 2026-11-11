"use client";

import { Drawer } from "@/components/ui/drawer";
import { usePreferences } from "@/features/settings/components/preferences-provider";
import { formatCurrency } from "@/utils/format";
import type { Invoice } from "../schemas";

/** Every successful charge, newest first. */
export function BillingHistoryDrawer({
  open,
  invoices,
  currency,
  onClose,
}: {
  open: boolean;
  invoices: Invoice[];
  currency: string;
  onClose: () => void;
}) {
  const { formatDate } = usePreferences();
  return (
    <Drawer open={open} title="Billing history" onClose={onClose}>
      {open ? (
        invoices.length === 0 ? (
          <p className="mt-8 rounded-2xl border border-dashed border-line-strong px-4 py-8 text-center text-sm text-muted">
            No payments yet. Your receipts will appear here after your first payment.
          </p>
        ) : (
          <ul className="mt-6 flex flex-col">
            {invoices.map((inv) => (
              <li
                key={inv.id}
                className="flex items-center justify-between gap-4 border-b border-line-soft py-4 last:border-b-0"
              >
                <div className="min-w-0">
                  <p className="text-[15px] font-semibold text-ink">{inv.description}</p>
                  <p className="mt-0.5 text-sm text-muted">
                    {formatDate(inv.date)} · {inv.method}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display text-lg font-bold text-ink">
                    {formatCurrency(inv.amountPaise / 100, currency)}
                  </p>
                  <span className="mt-1 inline-block rounded-full bg-success-tint px-2.5 py-0.5 text-xs font-bold text-success">
                    Paid
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )
      ) : null}
    </Drawer>
  );
}
