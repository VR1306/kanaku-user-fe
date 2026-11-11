import type { HTMLAttributes } from "react";
import { cn } from "@/utils/cn";

const TONES = {
  success: "bg-success-tint text-success",
  danger: "bg-danger-tint text-danger",
  brand: "bg-brand-tint text-link",
  accent: "bg-accent-tint text-accent-deep",
  violet: "bg-violet-tint text-violet",
} as const;

type BadgeProps = HTMLAttributes<HTMLSpanElement> & { tone?: keyof typeof TONES };

export function Badge({ tone = "brand", className, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-bold",
        TONES[tone],
        className,
      )}
      {...rest}
    />
  );
}
