"use client";

import { useId, type KeyboardEvent, type ReactNode } from "react";
import { m as motion } from "framer-motion";
import { SPRING } from "@/constants/motion";
import { cn } from "@/utils/cn";

type Option<T extends string> = { value: T; label: ReactNode };

type SegmentedControlProps<T extends string> = {
  options: readonly Option<T>[];
  value: T;
  onChange: (value: T) => void;
  "aria-label": string;
  /** "card": white pill with a border (page headers). "page": grey track (inside forms). */
  variant?: "card" | "page";
  className?: string;
};

/**
 * Tabs/radio group whose highlight slides to the chosen option. Arrow keys move the selection,
 * and only the selected option is in the tab order.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  variant = "card",
  className,
  ...rest
}: SegmentedControlProps<T>) {
  const id = useId();

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const step =
      e.key === "ArrowRight" || e.key === "ArrowDown"
        ? 1
        : e.key === "ArrowLeft" || e.key === "ArrowUp"
          ? -1
          : 0;
    if (!step) return;
    e.preventDefault();
    const i = options.findIndex((o) => o.value === value);
    const next = options[(i + step + options.length) % options.length];
    onChange(next.value);
    const buttons = e.currentTarget.querySelectorAll<HTMLButtonElement>("[role=radio]");
    buttons[options.indexOf(next)]?.focus();
  }

  return (
    <div
      role="radiogroup"
      aria-label={rest["aria-label"]}
      onKeyDown={onKeyDown}
      className={cn(
        "flex",
        variant === "card"
          ? "rounded-[14px] border border-line bg-surface p-[5px]"
          : "rounded-[14px] bg-page p-1",
        className,
      )}
    >
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(o.value)}
            className={cn(
              "relative rounded-[10px] px-4 text-sm transition-colors duration-200",
              variant === "card" ? "h-10 min-w-[48px]" : "h-[42px] px-5",
              selected ? "font-bold text-on-primary" : "font-medium text-ink-2 hover:text-ink",
            )}
          >
            {selected ? (
              <motion.span
                layoutId={`segment-${id}`}
                aria-hidden="true"
                className="absolute inset-0 rounded-[10px] bg-brand"
                transition={SPRING}
              />
            ) : null}
            <span className="relative">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
