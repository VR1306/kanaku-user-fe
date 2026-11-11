import { cn } from "@/utils/cn";

type LogoProps = {
  /** "dark" = on navy backgrounds, "light" = on light backgrounds (only the wordmark changes). */
  tone?: "dark" | "light";
  size?: number;
  /** Show only the mark (collapsed sidebar). */
  markOnly?: boolean;
  className?: string;
};

/** Same mark as the marketing site: cyan tile, navy bars. */
export function Logo({ tone = "light", size = 40, markOnly, className }: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="9" className="fill-accent" />
        <path d="M8 15h4v8H8zM14 9h4v14h-4zM20 12h4v11h-4z" className="fill-on-accent" />
      </svg>
      <span
        aria-hidden={markOnly}
        className={cn(
          "font-display text-[26px] leading-none font-bold whitespace-nowrap transition-opacity duration-200",
          markOnly && "opacity-0",
          tone === "dark" ? "text-on-inverse" : "text-ink",
        )}
      >
        Kanaku
      </span>
    </span>
  );
}
