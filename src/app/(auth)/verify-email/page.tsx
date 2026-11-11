import { RESEND_COOLDOWN_MS } from "@/constants/auth";
import { ROUTES } from "@/constants/routes";
import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CenteredAuthLayout } from "@/features/auth/components/auth-layouts";
import { VerifyEmailForm } from "@/features/auth/components/verify-email-form";
import { getFlow } from "@/lib/session";

export const metadata: Metadata = { title: "Verify email" };

async function VerifyContent() {
  const flow = await getFlow();
  if (!flow || flow.purpose !== "verify") redirect(ROUTES.signup);
  return (
    <VerifyEmailForm email={flow.email} resendAvailableAt={flow.sentAt + RESEND_COOLDOWN_MS} />
  );
}

export default function VerifyEmailPage() {
  return (
    <CenteredAuthLayout>
      <Suspense>
        <VerifyContent />
      </Suspense>
      <p className="sr-only">Almost there · next, set up your categories</p>
    </CenteredAuthLayout>
  );
}
