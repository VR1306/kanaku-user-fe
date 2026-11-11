import { RESEND_COOLDOWN_MS } from "@/constants/auth";
import { ROUTES } from "@/constants/routes";
import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { buttonClasses } from "@/components/ui/button";
import {
  AuthHeading,
  BackToLogin,
  CenteredAuthLayout,
} from "@/features/auth/components/auth-layouts";
import { ResendButton } from "@/features/auth/components/resend-button";
import { getFlow } from "@/lib/session";

export const metadata: Metadata = { title: "Check your inbox" };

async function SentContent() {
  const flow = await getFlow();
  if (!flow || flow.purpose !== "reset") redirect(ROUTES.forgotPassword);
  return (
    <div className="mt-6 flex flex-col items-center gap-6">
      <Link href={ROUTES.resetPassword} className={buttonClasses({ size: "lg", fullWidth: true })}>
        Enter code
      </Link>
      <ResendButton
        availableAt={flow.sentAt + RESEND_COOLDOWN_MS}
        label="Didn't get it? Resend"
        cooldownText="Didn't get it? Resend in {time}"
        className="text-[15px]"
      />
      <BackToLogin />
    </div>
  );
}

export default function ForgotPasswordSentPage() {
  return (
    <CenteredAuthLayout width="sm">
      <AuthHeading>Check your inbox</AuthHeading>
      <p className="mt-3 text-base text-muted">
        We&apos;ve sent a 6-digit code to your email. It expires in 15 minutes.
      </p>
      <Suspense>
        <SentContent />
      </Suspense>
    </CenteredAuthLayout>
  );
}
