"use client";

import { RESEND_COOLDOWN_MS } from "@/constants/auth";
import { useState, useTransition } from "react";
import { formatCountdown, useNow } from "@/hooks/use-now";
import { resendCodeAction } from "../actions";

type ResendButtonProps = {
  /** Epoch ms when resending becomes allowed. */
  availableAt: number;
  /** Shown while cooling down; `{time}` is replaced with the countdown. (A string, not a function, so server pages can pass it.) */
  cooldownText?: string;
  label?: string;
  className?: string;
};

export function ResendButton({
  availableAt,
  cooldownText = "Resend code in {time}",
  label = "Resend code",
  className,
}: ResendButtonProps) {
  const now = useNow();
  const [readyAt, setReadyAt] = useState(availableAt);
  const [status, setStatus] = useState<string>();
  const [pending, startTransition] = useTransition();
  const waiting = now === 0 || now < readyAt;

  function resend() {
    startTransition(async () => {
      const result = await resendCodeAction();
      setStatus(result.ok ? "A new code is on its way." : "Couldn't resend. Try again.");
      if (result.ok) setReadyAt(Date.now() + RESEND_COOLDOWN_MS);
    });
  }

  return (
    <span className={className}>
      {waiting ? (
        <span>
          {now === 0 ? label : cooldownText.replace("{time}", formatCountdown(readyAt - now))}
        </span>
      ) : (
        <button
          type="button"
          onClick={resend}
          disabled={pending}
          className="font-semibold text-accent-deep underline disabled:opacity-60"
        >
          {label}
        </button>
      )}
      {status ? (
        <span role="status" className="mt-1 block text-[13px] text-success">
          {status}
        </span>
      ) : null}
    </span>
  );
}
