import { motion, type HTMLMotionProps } from "framer-motion";
import { SPRING } from "@/constants/motion";
import { cn } from "@/utils/cn";

export type ButtonVariant = "primary" | "accent" | "outline-primary" | "outline" | "danger";

const VARIANTS: Record<ButtonVariant, string> = {
  // Same colour pairs and hover treatment as the landing page buttons.
  primary: "bg-brand text-on-primary hover:brightness-110",
  accent: "bg-accent text-on-accent hover:brightness-110",
  "outline-primary": "border border-brand text-link hover:bg-brand/5",
  outline: "border border-line-strong bg-surface text-ink hover:bg-page",
  danger: "bg-danger text-on-danger hover:brightness-110",
};

export type ButtonStyleOptions = {
  variant?: ButtonVariant;
  size?: "md" | "lg";
  fullWidth?: boolean;
  className?: string;
};

/** Shared class builder so links (`<Link>`) can look like buttons. */
export function buttonClasses({
  variant = "primary",
  size = "md",
  fullWidth,
  className,
}: ButtonStyleOptions = {}) {
  return cn(
    "inline-flex items-center justify-center rounded-control font-bold transition-colors",
    "disabled:cursor-not-allowed disabled:opacity-60",
    size === "lg" ? "h-14 px-6 text-base" : "h-[52px] px-6 text-[15px]",
    fullWidth && "w-full",
    VARIANTS[variant],
    className,
  );
}

type ButtonProps = HTMLMotionProps<"button"> & ButtonStyleOptions & { loading?: boolean };

export function Button({
  variant,
  size,
  fullWidth,
  className,
  loading,
  disabled,
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <motion.button
      type={type}
      whileHover={disabled || loading ? undefined : { y: -1 }}
      whileTap={disabled || loading ? undefined : { scale: 0.98 }}
      transition={SPRING}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClasses({ variant, size, fullWidth, className })}
      {...rest}
    >
      {loading ? "Please wait…" : children}
    </motion.button>
  );
}
