"use client";

import { FOCUS_FIELD } from "@/constants/styles";
import { CODE_LENGTH } from "@/constants/auth";
import { useRef, type ClipboardEvent, type KeyboardEvent } from "react";
import { motion } from "framer-motion";
import { cn } from "@/utils/cn";

type CodeInputProps = {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  error?: string;
  onBlur?: () => void;
};

/** Six single-digit boxes (paste, arrow keys and backspace supported) editing one string value. */
export function CodeInput({
  value,
  onChange,
  length = CODE_LENGTH,
  error,
  onBlur,
}: CodeInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? "");

  const focus = (i: number) => refs.current[Math.max(0, Math.min(length - 1, i))]?.focus();

  function setAt(i: number, digit: string) {
    const next = [...digits];
    next[i] = digit;
    onChange(next.join(""));
  }

  function onInput(i: number, raw: string) {
    const digit = raw.replace(/\D/g, "").slice(-1);
    setAt(i, digit);
    if (digit) focus(i + 1);
  }

  function onKeyDown(i: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[i]) focus(i - 1);
    if (e.key === "ArrowLeft") focus(i - 1);
    if (e.key === "ArrowRight") focus(i + 1);
  }

  function onPaste(e: ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;
    e.preventDefault();
    onChange(pasted);
    focus(pasted.length >= length ? length - 1 : pasted.length);
  }

  return (
    <div>
      <div role="group" aria-label={`${length}-digit code`} className="flex gap-2">
        {digits.map((digit, i) => (
          <motion.input
            key={i}
            whileFocus={{ y: -3, scale: 1.04 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            ref={(el) => {
              refs.current[i] = el;
            }}
            value={digit}
            inputMode="numeric"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            maxLength={1}
            aria-label={`Digit ${i + 1}`}
            aria-invalid={error ? true : undefined}
            onChange={(e) => onInput(i, e.target.value)}
            onKeyDown={(e) => onKeyDown(i, e)}
            onPaste={onPaste}
            onBlur={onBlur}
            onFocus={(e) => e.target.select()}
            className={cn(
              "h-16 min-w-0 flex-1 rounded-control border bg-surface text-center font-display text-[26px] font-bold text-ink",
              FOCUS_FIELD,
              error ? "border-danger" : digit ? "border-brand" : "border-line-strong",
            )}
          />
        ))}
      </div>
      {error ? (
        <p role="alert" className="mt-2 text-[13px] text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
