"use client";

import { FOCUS_FIELD } from "@/constants/styles";
import type { InputHTMLAttributes, ReactNode } from "react";
import { m as motion } from "framer-motion";
import { cn } from "@/utils/cn";

type FieldProps = {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  /** Rendered on the right of the label row (e.g. "Forgot password?"). */
  labelAction?: ReactNode;
  children: ReactNode;
};

/** Label + control + helper/error text wrapper. */
export function Field({ id, label, error, hint, labelAction, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-sm font-semibold text-ink">
          {label}
        </label>
        {labelAction}
      </div>
      {children}
      {error ? (
        <motion.p
          key={error}
          id={`${id}-error`}
          role="alert"
          className="text-[13px] text-danger"
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: [-6, 4, -2, 0] }}
          transition={{ duration: 0.35 }}
        >
          {error}
        </motion.p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-[13px] text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export const controlClasses =
  "h-[54px] w-full rounded-control border bg-surface px-4 text-[15px] text-ink " +
  "placeholder:text-subtle transition-colors " +
  FOCUS_FIELD;

type InputProps = InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean };

export function Input({ invalid, className, ...rest }: InputProps) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={cn(controlClasses, invalid ? "border-danger" : "border-line-strong", className)}
      {...rest}
    />
  );
}
