"use server";

import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { getSession } from "@/lib/session";
import { notifyBudgetsReady } from "@/services/notification-events";
import { markOnboarded, saveOnboarding } from "@/services/onboarding-service";
import { zodFieldErrors } from "@/utils/zod";
import type { ActionResult } from "@/types/forms";
import { onboardingSchema, type OnboardingValues } from "./schemas";

/** Validates the answers again on the server, creates the starting budgets and marks onboarding done. */
export async function completeOnboardingAction(values: OnboardingValues): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { message: "Your session has ended. Please log in again." };

  const parsed = onboardingSchema.safeParse(values);
  if (!parsed.success) return { errors: zodFieldErrors(parsed.error) };

  await saveOnboarding(session.id, parsed.data);
  await notifyBudgetsReady(
    session.id,
    parsed.data.categories.length,
    Number(parsed.data.monthlyBudget.replace(/,/g, "")),
  );
}

/**
 * Marks onboarding finished and opens the dashboard. Kept separate from saving because the redirect
 * gate would otherwise re-render the current page, which would otherwise skip the "You're all set" step.
 */
export async function finishOnboardingAction(): Promise<void> {
  const session = await getSession();
  if (!session) redirect(ROUTES.login);
  await markOnboarded(session.id);
  redirect(ROUTES.dashboard);
}
