import type { SelectHTMLAttributes } from "react";
import { Icon } from "@/components/icons/icon";
import { FOCUS_FIELD } from "@/constants/styles";
import { cn } from "@/utils/cn";

export type SelectOption = { value: string; label: string };

type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> & {
  options: SelectOption[];
  /** Visible height in px; the dashboard toolbar uses 48. */
  compact?: boolean;
};

/** Stand-alone select (not tied to a form). Use `FormSelect` inside forms. */
export function Select({ options, compact, className, ...rest }: SelectProps) {
  return (
    <div className={cn("relative", className)}>
      <select
        className={cn(
          "w-full appearance-none rounded-control border border-line bg-surface pr-10 pl-[14px] text-[15px] text-ink transition-colors",
          compact ? "h-12" : "h-[52px]",
          FOCUS_FIELD,
        )}
        {...rest}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <Icon
        name="chevronDown"
        size={16}
        strokeWidth={2}
        className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-ink"
      />
    </div>
  );
}
