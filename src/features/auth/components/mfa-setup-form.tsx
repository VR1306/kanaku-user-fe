"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, m as motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { CODE_LENGTH } from "@/constants/auth";
import { useActionSubmit } from "@/hooks/use-action-submit";
import { useZodForm } from "@/hooks/use-zod-form";
import { confirmMfaSetupAction } from "../actions";
import { mfaCodeSchema } from "../schemas";
import { AuthHeading, BackToLogin } from "./auth-layouts";
import { FormCodeInput } from "./form-code-input";

type MfaSetupFormProps = { qrDataUrl: string; secret: string };

const slide = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -24 },
  transition: { duration: 0.25 },
};

/** Two short steps so neither needs scrolling: 1) scan the QR / key, 2) enter the code. */
export function MfaSetupForm({ qrDataUrl, secret }: MfaSetupFormProps) {
  const [step, setStep] = useState<"scan" | "verify">("scan");
  const form = useZodForm(mfaCodeSchema, { code: "" });
  const { onSubmit, pending } = useActionSubmit(form, confirmMfaSetupAction);
  const [copied, setCopied] = useState(false);
  const groupedSecret = secret.match(/.{1,4}/g)?.join(" ") ?? secret;

  async function copy() {
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable: the key stays visible for manual entry */
    }
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      {step === "scan" ? (
        <motion.div key="scan" {...slide}>
          <div>
            <AuthHeading compact>Secure your account</AuthHeading>
            <p className="text-sm text-muted">Step 1 of 2 · Add Kanaku to your app</p>
          </div>

          <p className="mt-5 text-sm text-ink-2">
            Open Google Authenticator (or any authenticator app), tap <strong>+</strong>, and scan
            this QR code.
          </p>

          <div className="mt-4 flex items-center gap-4 rounded-panel border border-line bg-page p-4">
            <Image
              src={qrDataUrl}
              alt="QR code to add Kanaku to your authenticator app"
              width={148}
              height={148}
              unoptimized
              className="shrink-0 rounded-xl bg-white p-1.5"
            />
            <div className="min-w-0">
              <p className="text-xs text-muted">Can&apos;t scan? Enter this key instead</p>
              <p className="mt-1 font-mono text-[13px] font-semibold tracking-wider break-all text-ink">
                {groupedSecret}
              </p>
              <button
                type="button"
                onClick={copy}
                className="mt-2 text-[13px] font-semibold text-accent-deep underline"
              >
                {copied ? "Copied" : "Copy key"}
              </button>
            </div>
          </div>

          <Button
            type="button"
            size="lg"
            fullWidth
            className="mt-5"
            onClick={() => setStep("verify")}
          >
            I&apos;ve added it · Continue
          </Button>
          <div className="mt-4">
            <BackToLogin />
          </div>
        </motion.div>
      ) : (
        <motion.div key="verify" {...slide}>
          <AuthHeading>Enter the code</AuthHeading>
          <p className="mt-2 text-sm text-muted">
            Step 2 of 2 · Type the {CODE_LENGTH}-digit code shown for Kanaku in your app.
          </p>
          <Form form={form} onSubmit={onSubmit} className="mt-6 flex flex-col gap-5">
            <FormCodeInput />
            <Button type="submit" size="lg" fullWidth loading={pending}>
              Verify and continue
            </Button>
            <button
              type="button"
              onClick={() => setStep("scan")}
              className="text-center text-[15px] font-semibold text-link underline"
            >
              ← Back to QR code
            </button>
          </Form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
