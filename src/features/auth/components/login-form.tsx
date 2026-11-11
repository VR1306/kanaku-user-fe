"use client";

import { ROUTES } from "@/constants/routes";
import Link from "next/link";
import { Stagger, StaggerItem } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { Form, FormCheckbox, FormInput, FormPasswordInput } from "@/components/ui/form";
import { useActionSubmit } from "@/hooks/use-action-submit";
import { useZodForm } from "@/hooks/use-zod-form";
import { loginAction } from "../actions";
import { loginSchema } from "../schemas";
import { FormNotice } from "./form-parts";

type LoginFormProps = { next?: string; passwordWasReset?: boolean };

export function LoginForm({ next, passwordWasReset }: LoginFormProps) {
  const form = useZodForm(loginSchema, { email: "", password: "", remember: false, next });
  const { onSubmit, pending, message } = useActionSubmit(form, loginAction);

  return (
    <Stagger className="flex flex-col gap-5">
      <StaggerItem>
        <header>
          <h1 className="font-display text-[38px] leading-tight font-bold text-ink">Log in</h1>
          <p className="mt-2 text-base text-muted">
            New to Kanaku?{" "}
            <Link href={ROUTES.signup} className="font-bold text-link underline">
              Create an account
            </Link>
          </p>
        </header>
      </StaggerItem>

      {passwordWasReset ? (
        <FormNotice tone="success">Password updated. Log in with your new password.</FormNotice>
      ) : null}
      {message ? <FormNotice tone="error">{message}</FormNotice> : null}

      <StaggerItem>
        <Form form={form} onSubmit={onSubmit} className="flex flex-col gap-5">
          <FormInput
            name="email"
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
          />
          <FormPasswordInput
            name="password"
            label="Password"
            autoComplete="current-password"
            placeholder="••••••••"
            labelAction={
              <Link
                href={ROUTES.forgotPassword}
                className="text-sm font-semibold text-danger underline"
              >
                Forgot password?
              </Link>
            }
          />
          <FormCheckbox name="remember">Keep me signed in</FormCheckbox>
          <Button type="submit" size="lg" fullWidth loading={pending}>
            Log in
          </Button>
        </Form>
      </StaggerItem>
    </Stagger>
  );
}
