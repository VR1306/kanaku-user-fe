"use client";

import { Button } from "@/components/ui/button";
import { Form, FormInput } from "@/components/ui/form";
import { useActionSubmit } from "@/hooks/use-action-submit";
import { useZodForm } from "@/hooks/use-zod-form";
import { forgotPasswordAction } from "../actions";
import { forgotPasswordSchema } from "../schemas";
import { AuthHeading, BackToLogin } from "./auth-layouts";

export function ForgotPasswordForm() {
  const form = useZodForm(forgotPasswordSchema, { email: "" });
  const { onSubmit, pending } = useActionSubmit(form, forgotPasswordAction);

  return (
    <>
      <AuthHeading>Forgot your password?</AuthHeading>
      <p className="mt-3 text-base text-muted">
        No trouble. Enter your email and we&apos;ll send you a reset code.
      </p>
      <Form form={form} onSubmit={onSubmit} className="mt-7 flex flex-col gap-6">
        <FormInput
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
        />
        <Button type="submit" size="lg" fullWidth loading={pending}>
          Send reset code
        </Button>
        <BackToLogin />
      </Form>
    </>
  );
}
