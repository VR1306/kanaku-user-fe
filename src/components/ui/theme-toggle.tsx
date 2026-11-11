"use client";

import { Icon } from "@/components/icons/icon";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/utils/cn";

/** Round icon button (used on the auth pages). */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const next = theme === "dark" ? "light" : "dark";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
      className={cn(
        "grid size-10 place-items-center rounded-full border border-line bg-surface text-ink-2 transition-colors hover:text-ink",
        className,
      )}
    >
      <Icon name={theme === "dark" ? "sun" : "moon"} size={18} />
    </button>
  );
}
