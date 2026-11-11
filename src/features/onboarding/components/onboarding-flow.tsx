"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { TRANSITION } from "@/constants/motion";
import {
  DEFAULT_MONTHLY_BUDGET,
  DEFAULT_ONBOARDING_CATEGORIES,
  ONBOARDING_STEPS,
} from "@/constants/onboarding";
import { useZodForm } from "@/hooks/use-zod-form";
import { cn } from "@/utils/cn";
import { formatCurrency } from "@/utils/format";
import { completeOnboardingAction, finishOnboardingAction } from "../actions";
import { amountOf, onboardingSchema, type OnboardingValues } from "../schemas";
import { AboutYouStep, CategoriesStep } from "./steps";

const TITLES = [
  {
    title: "Let's set up your account",
    body: "A few details so Kanaku can personalise your dashboard.",
  },
  {
    title: "Choose your categories",
    body: "Pick what you spend on. You can change these anytime.",
  },
] as const;

const DEFAULTS: OnboardingValues = {
  currency: "INR",
  income: "",
  salaryDay: "1",
  savingsGoal: "0",
  categories: DEFAULT_ONBOARDING_CATEGORIES,
  monthlyBudget: String(DEFAULT_MONTHLY_BUDGET),
};

const Mark = () => (
  <span className="grid size-24 place-items-center rounded-full bg-brand">
    <svg viewBox="0 0 32 32" width="48" height="48" aria-hidden="true">
      <path d="M8 15h4v8H8zM14 9h4v14h-4zM20 12h4v11h-4z" className="fill-accent" />
    </svg>
  </span>
);

/** Three-step first-run setup. Nothing is saved until the categories step is submitted. */
export function OnboardingFlow() {
  const [step, setStep] = useState(1);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string>();
  const form = useZodForm(onboardingSchema, DEFAULTS);

  /** Suggest a budget from income and savings goal, unless the person already typed one. */
  function suggestBudget() {
    const { income, savingsGoal } = form.getValues();
    if (form.formState.dirtyFields.monthlyBudget || !income || form.formState.errors.income) return;
    const suggested = Math.round(amountOf(income) * (1 - Number(savingsGoal) / 100));
    if (suggested > 0) form.setValue("monthlyBudget", String(suggested));
  }

  function skipAboutYou() {
    form.setValue("income", "");
    form.clearErrors();
    setStep(2);
  }

  function onSubmit(values: OnboardingValues) {
    setMessage(undefined);
    if (step === 1) {
      suggestBudget();
      setStep(2);
      return;
    }
    startTransition(async () => {
      const result = await completeOnboardingAction(values);
      if (result?.errors || result?.message) {
        setMessage(result.message ?? Object.values(result.errors ?? {})[0]);
        return;
      }
      setStep(3);
    });
  }

  const values = form.watch();
  const count = values.categories.length;
  const budget = amountOf(values.monthlyBudget || "0");

  return (
    <div className="mx-auto w-full max-w-[720px] px-4 py-10 sm:py-12">
      <header className="flex items-center justify-between">
        <Logo tone="light" size={40} />
        <p className="text-sm font-semibold text-muted">
          Step {step} of {ONBOARDING_STEPS}
        </p>
      </header>

      <div
        role="progressbar"
        aria-label="Setup progress"
        aria-valuemin={1}
        aria-valuemax={ONBOARDING_STEPS}
        aria-valuenow={step}
        className="mt-8 flex gap-2"
      >
        {Array.from({ length: ONBOARDING_STEPS }, (_, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors duration-300",
              i < step ? "bg-accent" : "bg-line",
            )}
          />
        ))}
      </div>

      <Form
        form={form}
        onSubmit={onSubmit}
        className="mt-8 rounded-[28px] border border-line bg-surface p-6 sm:p-10"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ ...TRANSITION, duration: 0.25 }}
          >
            {step < 3 ? (
              <>
                <h1 className="font-display text-[30px] leading-tight font-bold text-ink sm:text-[38px]">
                  {TITLES[step - 1].title}
                </h1>
                <p className="mt-2 mb-8 text-base text-muted">{TITLES[step - 1].body}</p>
                {step === 1 ? <AboutYouStep /> : <CategoriesStep />}
              </>
            ) : (
              <div className="flex flex-col items-center py-6 text-center">
                <Mark />
                <h1 className="mt-8 font-display text-[34px] font-bold text-ink sm:text-[42px]">
                  You&apos;re all set!
                </h1>
                <p className="mt-3 max-w-[520px] text-[17px] text-muted">
                  Your workspace is ready: {count} {count === 1 ? "category" : "categories"} and a{" "}
                  {formatCurrency(budget)} monthly budget. Add your first expense to begin.
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {message ? (
          <p
            role="alert"
            className="mt-6 rounded-control bg-danger-tint px-4 py-3 text-sm text-danger"
          >
            {message}
          </p>
        ) : null}

        <div className="mt-8 flex items-center justify-between gap-3 border-t border-line-soft pt-6">
          {step === 1 ? (
            <Button variant="outline" onClick={skipAboutYou}>
              Skip for now
            </Button>
          ) : (
            <Button variant="outline" onClick={() => setStep(step - 1)} disabled={pending}>
              Back
            </Button>
          )}
          {step < 3 ? (
            <Button type="submit" loading={pending}>
              Continue
            </Button>
          ) : (
            <Button
              variant="accent"
              loading={pending}
              onClick={() => startTransition(() => finishOnboardingAction())}
            >
              Go to my dashboard
            </Button>
          )}
        </div>
      </Form>
    </div>
  );
}
