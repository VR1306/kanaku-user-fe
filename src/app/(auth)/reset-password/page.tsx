import { RESEND_COOLDOWN_MS } from "@/constants/auth";
import { ROUTES } from "@/constants/routes";
import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CenteredAuthLayout } from "@/features/auth/components/auth-layouts";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";
import { getFlow } from "@/lib/session";

export const metadata: Metadata = { title: "Reset password" };

async function ResetContent() {
  const flow = await getFlow();
  if (!flow || flow.purpose !== "reset") redirect(ROUTES.forgotPassword);
  return (
    <ResetPasswordForm
      expiresAt={flow.expiresAt}
      resendAvailableAt={flow.sentAt + RESEND_COOLDOWN_MS}
    />
  );
}

export default function ResetPasswordPage() {
  return (
    <CenteredAuthLayout>
      <Suspense>
        <ResetContent />
      </Suspense>
    </CenteredAuthLayout>
  );
}
