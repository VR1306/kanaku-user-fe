"use client";

import { useController, useFormContext } from "react-hook-form";
import { FormInput, FormSelect } from "@/components/ui/form";
import {
  CURRENCIES,
  ONBOARDING_CATEGORIES,
  SALARY_DAYS,
  SAVINGS_GOALS,
} from "@/constants/onboarding";
import { cn } from "@/utils/cn";
import type { OnboardingValues } from "../schemas";

export function AboutYouStep() {
  return (
    <div className="grid gap-x-7 gap-y-6 sm:grid-cols-2">
      <FormSelect
        name="currency"
        label="Currency"
        options={CURRENCIES.map((c) => ({ value: c.value, label: c.label }))}
        hint="More currencies are coming."
      />
      <FormInput
        name="income"
        label="Monthly income"
        inputMode="decimal"
        autoComplete="off"
        placeholder="₹85,000"
      />
      <FormSelect name="salaryDay" label="Salary credited on" options={SALARY_DAYS} />
      <FormSelect name="savingsGoal" label="Savings goal" options={SAVINGS_GOALS} />
    </div>
  );
}

export function CategoriesStep() {
  const { control, getValues } = useFormContext<OnboardingValues>();
  const { field, fieldState } = useController({ control, name: "categories" });
  const chosen = field.value;

  const toggle = (name: string) => {
    const current = getValues("categories"); // not the render-time value: rapid taps must not clobber each other
    field.onChange(current.includes(name) ? current.filter((c) => c !== name) : [...current, name]);
  };

  return (
    <div className="flex flex-col gap-7">
      <fieldset>
        <legend className="sr-only">Categories you spend on</legend>
        <div className="flex flex-wrap gap-2.5">
          {ONBOARDING_CATEGORIES.map((name) => {
            const on = chosen.includes(name);
            return (
              <button
                key={name}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(name)}
                className={cn(
                  "h-[52px] rounded-control border px-5 text-[15px] font-semibold transition-colors",
                  on
                    ? "border-brand bg-brand text-on-primary"
                    : "border-line-strong bg-surface text-ink-2 hover:bg-page",
                )}
              >
                {name}
              </button>
            );
          })}
        </div>
        {fieldState.error ? (
          <p role="alert" className="mt-3 text-[13px] text-danger">
            {fieldState.error.message}
          </p>
        ) : null}
      </fieldset>
      <div className="max-w-[354px]">
        <FormInput
          name="monthlyBudget"
          label="Overall monthly budget"
          inputMode="decimal"
          autoComplete="off"
          placeholder="₹50,000"
        />
      </div>
    </div>
  );
}
