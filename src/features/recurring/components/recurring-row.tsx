"use client";

import { motion } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import { EASE_OUT } from "@/constants/motion";
import { describeSchedule } from "@/constants/recurring";
import { shortName } from "@/features/categories/components/categories-provider";
import { TONE_TINT } from "@/features/dashboard/tones";
import { cn } from "@/utils/cn";
import { usePreferences } from "@/features/settings/components/preferences-provider";
import { formatCurrency } from "@/utils/format";
import type { RecurringItem } from "../schemas";

const shortCategory = (item: RecurringItem) =>
  item.type === "income" ? "Income" : shortName(item.category);

type Props = {
  item: RecurringItem;
  index: number;
  currency: string;
  onEdit: () => void;
  onToggle: (active: boolean) => void;
};

export function RecurringRow({ item, index, currency, onEdit, onToggle }: Props) {
  const income = item.type === "income";
  const { formatDate } = usePreferences();
  const meta = [
    describeSchedule(item.frequency, item.anchorDay, item.nextDue),
    shortCategory(item),
    item.method,
  ];
  return (
    <motion.li
      layout="position"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: EASE_OUT, delay: Math.min(index, 8) * 0.04 }}
      className="grid items-center gap-x-4 gap-y-3 border-b border-line-soft px-5 py-4 last:border-b-0 sm:px-6 md:grid-cols-[minmax(0,1fr)_150px_150px_56px]"
    >
      <button
        type="button"
        onClick={onEdit}
        aria-label={`Edit ${item.title}`}
        className="flex min-w-0 items-center gap-4 rounded-control text-left"
      >
        <span
          aria-hidden="true"
          className={cn(
            "grid size-12 shrink-0 place-items-center rounded-[15px] font-display text-[19px] font-bold transition-opacity duration-200",
            TONE_TINT[item.tone],
            !item.active && "opacity-50",
          )}
        >
          {item.title.charAt(0).toUpperCase()}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-base font-bold text-ink">{item.title}</span>
          <span className="mt-0.5 block text-[13px] text-muted">{meta.join(" · ")}</span>
        </span>
      </button>

      <div className="md:text-left">
        <p className="text-xs tracking-[0.08em] text-muted uppercase">Next</p>
        <p className={cn("text-[15px] font-semibold", item.active ? "text-ink" : "text-danger")}>
          {item.active ? formatDate(item.nextDue) : "Paused"}
        </p>
      </div>

      <p
        className={cn(
          "font-display text-xl font-bold whitespace-nowrap md:text-right",
          income ? "text-success" : "text-ink",
        )}
      >
        {income ? "+" : "−"}
        {formatCurrency(item.amount, currency)}
      </p>

      <div className="flex md:justify-end">
        <Switch
          checked={item.active}
          onChange={onToggle}
          aria-label={`${item.active ? "Pause" : "Resume"} ${item.title}`}
        />
      </div>
    </motion.li>
  );
}
