import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { ROUTES } from "@/constants/routes";
import { CenteredAuthLayout } from "@/features/auth/components/auth-layouts";
import { MfaSetupForm } from "@/features/auth/components/mfa-setup-form";
import { getFlow } from "@/lib/session";
import * as auth from "@/services/auth-service";

export const metadata: Metadata = { title: "Set up authenticator" };

async function SetupContent() {
  const flow = await getFlow();
  if (!flow || flow.purpose !== "mfa-setup") redirect(ROUTES.login);
  const setup = await auth.beginMfaSetup(flow.email);
  if (!setup.ok) redirect(ROUTES.login);
  const qrDataUrl = await QRCode.toDataURL(setup.data.uri, { margin: 1, width: 384 });
  return <MfaSetupForm qrDataUrl={qrDataUrl} secret={setup.data.secret} />;
}

export default function MfaSetupPage() {
  return (
    <CenteredAuthLayout>
      <Suspense>
        <SetupContent />
      </Suspense>
    </CenteredAuthLayout>
  );
}
