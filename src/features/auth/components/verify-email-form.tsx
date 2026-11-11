"use client";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useActionSubmit } from "@/hooks/use-action-submit";
import { useZodForm } from "@/hooks/use-zod-form";
import { changeEmailAction, verifyEmailAction } from "../actions";
import { verifyEmailSchema } from "../schemas";
import { AuthHeading } from "./auth-layouts";
import { FormCodeInput } from "./form-code-input";
import { ResendButton } from "./resend-button";

type VerifyEmailFormProps = { email: string; resendAvailableAt: number };

export function VerifyEmailForm({ email, resendAvailableAt }: VerifyEmailFormProps) {
  const form = useZodForm(verifyEmailSchema, { code: "" });
  const { onSubmit, pending } = useActionSubmit(form, verifyEmailAction);

  return (
    <>
      <AuthHeading>Verify your email</AuthHeading>
      <p className="mt-3 text-base text-muted">
        Enter the 6-digit code we sent to <strong className="text-ink">{email}</strong>
      </p>

      <Form form={form} onSubmit={onSubmit} className="mt-7 flex flex-col gap-7">
        <FormCodeInput />
        <Button type="submit" size="lg" fullWidth loading={pending}>
          Verify and continue
        </Button>
      </Form>

      <div className="mt-6 flex items-center justify-between text-[15px] text-muted">
        <ResendButton availableAt={resendAvailableAt} />
        <form action={changeEmailAction}>
          <button type="submit" className="font-semibold text-link">
            Change email
          </button>
        </form>
      </div>
    </>
  );
}
