"use client";

import { m as motion } from "framer-motion";
import { TRANSITION } from "@/constants/motion";
import { cn } from "@/utils/cn";

export type BarDatum = {
  id: string;
  label: string;
  value: number;
  /** Text shown above the bar. */
  valueLabel: string;
  /** Full text for tooltip / screen readers. */
  description: string;
};

type BarChartProps = {
  data: BarDatum[];
  /** Index of the bar to emphasise (e.g. the selected month). */
  activeIndex?: number;
  /** Pixel height of the tallest bar. */
  maxBarHeight?: number;
};

/** Simple responsive column chart. Bar heights are proportional to value. */
export function BarChart({ data, activeIndex, maxBarHeight = 168 }: BarChartProps) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <ul
      className="flex items-end justify-between gap-2 sm:gap-3"
      style={{ minHeight: maxBarHeight + 56 }}
      aria-label="Monthly spending"
    >
      {data.map((d, i) => {
        const active = i === activeIndex;
        const height = Math.max(6, (d.value / max) * maxBarHeight);
        return (
          <li
            key={d.id}
            className="flex min-w-0 flex-1 flex-col items-center gap-2"
            title={d.description}
          >
            <span className={cn("text-xs", active ? "font-bold text-link" : "text-muted")}>
              {d.valueLabel}
            </span>
            <motion.div
              role="img"
              aria-label={d.description}
              className={cn(
                "w-full max-w-14 origin-bottom rounded-t-[12px] rounded-b-[4px]",
                active ? "bg-brand" : "bg-brand-tint",
              )}
              style={{ height }}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ ...TRANSITION, delay: i * 0.05 }}
            />
            <span className={cn("text-[13px]", active ? "font-bold text-link" : "text-muted")}>
              {d.label}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
