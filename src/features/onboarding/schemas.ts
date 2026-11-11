import { z } from "zod";
import {
  CURRENCIES,
  ONBOARDING_CATEGORIES,
  SALARY_DAYS,
  SAVINGS_GOALS,
} from "@/constants/onboarding";
import { AMOUNT_MAX } from "@/constants/transactions";

const amount = /^\d[\d,]*(\.\d{0,2})?$/;
const toNumber = (s: string) => Number(s.replace(/,/g, ""));

const oneOf = (options: readonly { value: string }[], message: string) =>
  z.string().refine((v) => options.some((o) => o.value === v), message);

/** Everything collected across the three steps. Amounts stay as text so people can type freely. */
export const onboardingSchema = z.object({
  currency: oneOf(CURRENCIES, "Choose a currency."),
  /** Optional: people can skip step 1. */
  income: z
    .string()
    .trim()
    .refine((s) => s === "" || amount.test(s), "Use digits only, e.g. 85000.")
    .refine((s) => s === "" || toNumber(s) <= AMOUNT_MAX, "That amount is too large."),
  salaryDay: oneOf(SALARY_DAYS, "Choose a day."),
  savingsGoal: oneOf(SAVINGS_GOALS, "Choose a goal."),
  categories: z
    .array(z.enum(ONBOARDING_CATEGORIES as [string, ...string[]]))
    .min(1, "Pick at least one category."),
  monthlyBudget: z
    .string()
    .trim()
    .min(1, "Enter your monthly budget.")
    .refine((s) => amount.test(s), "Use digits only, e.g. 50000.")
    .refine((s) => toNumber(s) > 0, "Enter an amount greater than zero.")
    .refine((s) => toNumber(s) <= AMOUNT_MAX, "That amount is too large."),
});
export type OnboardingValues = z.infer<typeof onboardingSchema>;

export const amountOf = toNumber;
