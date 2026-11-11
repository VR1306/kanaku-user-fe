"use client";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useActionSubmit } from "@/hooks/use-action-submit";
import { useZodForm } from "@/hooks/use-zod-form";
import { verifyMfaAction } from "../actions";
import { mfaCodeSchema } from "../schemas";
import { AuthHeading, BackToLogin } from "./auth-layouts";
import { FormCodeInput } from "./form-code-input";

export function MfaVerifyForm() {
  const form = useZodForm(mfaCodeSchema, { code: "" });
  const { onSubmit, pending } = useActionSubmit(form, verifyMfaAction);

  return (
    <>
      <AuthHeading>Two-step verification</AuthHeading>
      <p className="mt-3 text-base text-muted">
        Open Google Authenticator and enter the 6-digit code for Kanaku.
      </p>
      <Form form={form} onSubmit={onSubmit} className="mt-7 flex flex-col gap-7">
        <FormCodeInput />
        <Button type="submit" size="lg" fullWidth loading={pending}>
          Verify and log in
        </Button>
        <BackToLogin />
      </Form>
    </>
  );
}
