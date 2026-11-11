"use client";

import { useFormContext, useWatch } from "react-hook-form";
import { QUICK_ADD } from "@/constants/transactions";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { formatCurrency } from "@/utils/format";
import { useImpact } from "../hooks/use-impact";
import type { TransactionFormValues } from "../schemas";
import { ImpactCard } from "./impact-card";

/** Right-hand column of the form: live budget impact and one-tap presets. */
export function FormAside({ excludeId }: { excludeId?: string }) {
  const { control, setValue } = useFormContext<TransactionFormValues>();
  const [type, category, amountText] = useWatch({ control, name: ["type", "category", "amount"] });
  const amount = Number((amountText ?? "").replace(/,/g, ""));
  const debounced = useDebouncedValue(Number.isFinite(amount) ? amount : 0, 300);
  const { impact, failed } = useImpact(
    category ? { type, category, amount: debounced || undefined, excludeId } : null,
  );

  function applyPreset(p: (typeof QUICK_ADD)[number]) {
    const opts = { shouldDirty: true, shouldValidate: false } as const;
    setValue("type", "expense", opts);
    setValue("title", p.title, opts);
    setValue("amount", String(p.amount), opts);
    setValue("category", p.category, opts);
    setValue("method", p.method, opts);
  }

  return (
    <aside className="flex flex-col gap-5">
      <ImpactCard impact={impact} unavailable={failed} heading="After saving" />
      <section aria-label="Quick add" className="rounded-[24px] border border-line bg-surface p-6">
        <h2 className="font-display text-xl font-bold text-ink">Quick add</h2>
        <div className="mt-4 flex flex-col gap-2.5">
          {QUICK_ADD.map((p) => (
            <button
              key={p.title}
              type="button"
              onClick={() => applyPreset(p)}
              className="flex h-12 items-center justify-between rounded-[14px] border border-line bg-surface px-4 text-[15px] text-ink transition-colors hover:bg-page"
            >
              <span>{p.title}</span>
              <span className="font-bold">{formatCurrency(p.amount)}</span>
            </button>
          ))}
        </div>
      </section>
    </aside>
  );
}
