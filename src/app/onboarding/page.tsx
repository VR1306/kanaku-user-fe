import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { OnboardingFlow } from "@/features/onboarding/components/onboarding-flow";
import { getSession } from "@/lib/session";
import { isOnboarded } from "@/services/onboarding-service";

export const metadata: Metadata = { title: "Set up your account" };

async function OnboardingGate() {
  const session = await getSession();
  if (!session) redirect(ROUTES.login);
  if (await isOnboarded(session.id)) redirect(ROUTES.dashboard);
  return <OnboardingFlow />;
}

export default function OnboardingPage() {
  return (
    <main className="min-h-screen bg-page">
      <Suspense fallback={<div className="min-h-screen" aria-busy="true" />}>
        <OnboardingGate />
      </Suspense>
    </main>
  );
}
