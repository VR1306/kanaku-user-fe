"use client";

import { ROUTES } from "@/constants/routes";
import Link from "next/link";
import { useWatch } from "react-hook-form";
import { Stagger, StaggerItem } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { Form, FormCheckbox, FormInput, FormPasswordInput } from "@/components/ui/form";
import { useActionSubmit } from "@/hooks/use-action-submit";
import { useZodForm } from "@/hooks/use-zod-form";
import { signupAction } from "../actions";
import { signupSchema } from "../schemas";
import { FormNotice } from "./form-parts";
import { PasswordStrength } from "./password-strength";

export function SignupForm() {
  const form = useZodForm(signupSchema, { name: "", email: "", password: "", terms: false });
  const { onSubmit, pending, message } = useActionSubmit(form, signupAction);
  const password = useWatch({ control: form.control, name: "password" });

  return (
    <Stagger className="flex flex-col gap-5">
      <StaggerItem>
        <header>
          <h1 className="font-display text-[38px] leading-tight font-bold text-ink">
            Create your account
          </h1>
          <p className="mt-2 text-base text-muted">
            Already a member?{" "}
            <Link href={ROUTES.login} className="font-bold text-link underline">
              Log in
            </Link>
          </p>
        </header>
      </StaggerItem>

      {message ? <FormNotice tone="error">{message}</FormNotice> : null}

      <StaggerItem>
        <Form form={form} onSubmit={onSubmit} className="flex flex-col gap-5">
          <FormInput name="name" label="Full name" autoComplete="name" placeholder="Your name" />
          <FormInput
            name="email"
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
          />
          <div>
            <FormPasswordInput
              name="password"
              label="Password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
            />
            <div className="mt-3">
              <PasswordStrength password={password} />
            </div>
          </div>
          <FormCheckbox name="terms">
            I agree to the{" "}
            <a href={ROUTES.terms} target="_blank" rel="noopener noreferrer" className="text-link">
              Terms
            </a>{" "}
            and{" "}
            <a
              href={ROUTES.privacy}
              target="_blank"
              rel="noopener noreferrer"
              className="text-link"
            >
              Privacy Policy
            </a>
          </FormCheckbox>
          <Button type="submit" size="lg" fullWidth loading={pending}>
            Create account
          </Button>
        </Form>
      </StaggerItem>
    </Stagger>
  );
}
