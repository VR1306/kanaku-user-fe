"use client";

import { useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form, FormPasswordInput } from "@/components/ui/form";
import { useActionSubmit } from "@/hooks/use-action-submit";
import { useZodForm } from "@/hooks/use-zod-form";
import { cn } from "@/utils/cn";
import { resetPasswordAction } from "../actions";
import { resetPasswordSchema } from "../schemas";
import { PASSWORD_RULES } from "../validation";
import { AuthHeading } from "./auth-layouts";
import { CodeExpiry } from "./code-expiry";
import { FormCodeInput } from "./form-code-input";
import { ResendButton } from "./resend-button";

type ResetPasswordFormProps = { expiresAt: number; resendAvailableAt: number };

export function ResetPasswordForm({ expiresAt, resendAvailableAt }: ResetPasswordFormProps) {
  const form = useZodForm(resetPasswordSchema, { code: "", password: "", confirm: "" });
  const { onSubmit, pending } = useActionSubmit(form, resetPasswordAction);
  const password = useWatch({ control: form.control, name: "password" });

  return (
    <>
      <AuthHeading>Set a new password</AuthHeading>
      <p className="mt-3 text-base text-muted">
        Enter the 6-digit code from your email, then choose a new password.
      </p>

      <Form form={form} onSubmit={onSubmit} className="mt-7 flex flex-col gap-5">
        <div>
          <p className="mb-2 text-sm font-semibold text-ink">Reset code</p>
          <FormCodeInput />
          <p className="mt-3 text-[13px] text-muted">
            <CodeExpiry expiresAt={expiresAt} /> ·{" "}
            <ResendButton
              availableAt={resendAvailableAt}
              cooldownText="Resend in {time}"
              className="text-[13px]"
            />
          </p>
        </div>

        <FormPasswordInput
          name="password"
          label="New password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
        />
        <FormPasswordInput
          name="confirm"
          label="Confirm password"
          autoComplete="new-password"
          placeholder="Re-enter password"
        />

        <ul className="flex flex-col gap-1 text-sm" aria-label="Password requirements">
          {PASSWORD_RULES.map((rule) => {
            const ok = rule.test(password);
            return (
              <li key={rule.id} className={cn(ok ? "text-success" : "text-muted")}>
                {ok ? "✓" : "○"} {rule.label}
              </li>
            );
          })}
        </ul>

        <Button type="submit" size="lg" fullWidth loading={pending}>
          Update password
        </Button>
      </Form>
    </>
  );
}
