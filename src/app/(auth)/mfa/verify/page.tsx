import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { CenteredAuthLayout } from "@/features/auth/components/auth-layouts";
import { MfaVerifyForm } from "@/features/auth/components/mfa-verify-form";
import { getFlow } from "@/lib/session";

export const metadata: Metadata = { title: "Two-step verification" };

async function VerifyContent() {
  const flow = await getFlow();
  if (!flow || flow.purpose !== "mfa") redirect(ROUTES.login);
  return <MfaVerifyForm />;
}

export default function MfaVerifyPage() {
  return (
    <CenteredAuthLayout width="sm">
      <Suspense>
        <VerifyContent />
      </Suspense>
    </CenteredAuthLayout>
  );
}
