import type { Metadata } from "next";
import { CenteredAuthLayout } from "@/features/auth/components/auth-layouts";
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <CenteredAuthLayout width="sm">
      <ForgotPasswordForm />
    </CenteredAuthLayout>
  );
}
