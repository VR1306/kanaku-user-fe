"use client";

import { m as motion } from "framer-motion";
import { SPRING } from "@/constants/motion";
import { cn } from "@/utils/cn";

type SwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  "aria-label": string;
  disabled?: boolean;
};

/** On/off toggle. The knob slides with a spring and the track changes colour. */
export function Switch({ checked, onChange, disabled, ...rest }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={rest["aria-label"]}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-8 w-14 shrink-0 rounded-full transition-colors duration-200",
        "disabled:cursor-not-allowed disabled:opacity-60",
        checked ? "bg-brand" : "bg-line-strong",
      )}
    >
      <motion.span
        aria-hidden="true"
        initial={false}
        animate={{ x: checked ? 24 : 0 }}
        transition={SPRING}
        className={cn(
          "absolute top-[3px] left-[3px] size-[26px] rounded-full shadow-sm transition-colors duration-200",
          checked ? "bg-accent" : "bg-white",
        )}
      />
    </button>
  );
}
