"use client";

import { motion } from "framer-motion";
import { Icon } from "@/components/icons/icon";
import { EASE_OUT } from "@/constants/motion";
import { TONE_TINT } from "@/features/dashboard/tones";
import { cn } from "@/utils/cn";
import { formatCurrency } from "@/utils/format";
import type { CategoryItem } from "../schemas";

type Props = {
  item: CategoryItem;
  index: number;
  currency: string;
  editing: boolean;
  onEdit: () => void;
  onDelete: () => void;
};

const iconButton =
  "grid size-10 place-items-center rounded-[10px] bg-page transition-colors hover:bg-line focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-40";

export function CategoryCard({ item, index, currency, editing, onEdit, onDelete }: Props) {
  return (
    <motion.article
      layout="position"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: EASE_OUT, delay: Math.min(index, 8) * 0.04 }}
      className={cn(
        "flex flex-col rounded-[22px] border bg-surface p-[23px] transition-colors duration-200",
        editing ? "border-brand ring-2 ring-brand/20" : "border-line",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          aria-hidden="true"
          className={cn(
            "grid size-[52px] place-items-center rounded-[16px] font-display text-[22px] font-bold",
            TONE_TINT[item.tone],
          )}
        >
          {item.name.charAt(0).toUpperCase()}
        </span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={onEdit}
            aria-label={`Edit ${item.name}`}
            className={cn(iconButton, "text-link")}
          >
            <Icon name="edit" size={16} strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={item.fallback}
            aria-label={`Delete ${item.name}`}
            title={item.fallback ? "This is the fallback category and can't be deleted" : undefined}
            className={cn(iconButton, "text-danger")}
          >
            <Icon name="trash" size={16} strokeWidth={2} />
          </button>
        </div>
      </div>
      <h3 className="mt-5 text-[17px] font-bold break-words text-ink">{item.name}</h3>
      <p className="mt-1 text-[13px] text-muted">
        {item.monthCount} {item.monthCount === 1 ? "transaction" : "transactions"} this month
      </p>
      <p className="mt-5 font-display text-[26px] leading-tight font-bold text-ink">
        {formatCurrency(item.monthTotal, currency)}
      </p>
    </motion.article>
  );
}
