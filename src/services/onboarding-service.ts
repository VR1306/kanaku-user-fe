/**
 * Onboarding backed by MongoDB (collection: profiles, one document per user, _id = user id).
 * Saves the profile answers, turns the chosen categories and overall budget into starting
 * budgets, and records whether the user has finished onboarding.
 */
import type { OnboardingValues } from "@/features/onboarding/schemas";
import { amountOf } from "@/features/onboarding/schemas";
import { getDb } from "@/lib/mongo";
import { initBudgets } from "./budgets-service";

async function profiles() {
  return (await getDb()).collection<{ _id: string; onboardedAt?: Date }>("profiles");
}

export async function saveOnboarding(userId: string, values: OnboardingValues) {
  await (
    await profiles()
  ).updateOne(
    { _id: userId },
    {
      $set: {
        currency: values.currency,
        monthlyIncome: values.income ? amountOf(values.income) : null,
        salaryDay: Number(values.salaryDay),
        savingsGoalPercent: Number(values.savingsGoal),
      },
    },
    { upsert: true },
  );
  await initBudgets(userId, amountOf(values.monthlyBudget), values.categories);
}

export async function isOnboarded(userId: string): Promise<boolean> {
  const profile = await (
    await profiles()
  ).findOne({ _id: userId }, { projection: { onboardedAt: 1 } });
  return Boolean(profile?.onboardedAt);
}

export async function markOnboarded(userId: string) {
  await (
    await profiles()
  ).updateOne({ _id: userId }, { $set: { onboardedAt: new Date() } }, { upsert: true });
}
