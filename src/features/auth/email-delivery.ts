import { sendBrandedEmail } from "@/lib/email/send";
import { passwordResetEmail, verificationEmail } from "@/lib/email/auth-templates";
import type { CodePurpose } from "@/types/auth";

type Issued = { code?: string; name?: string };

/**
 * Emails a one-time code. `issued.code` is absent when the address has no account,
 * in which case nothing is sent but we still report success (no account enumeration).
 */
export async function deliverCode(
  to: string,
  purpose: CodePurpose,
  issued: Issued,
): Promise<boolean> {
  if (!issued.code) return true;
  const input = {
    name: issued.name,
    code: issued.code,
    supportEmail: process.env.SUPPORT_EMAIL || undefined,
  };
  return sendBrandedEmail(
    to,
    purpose === "verify" ? verificationEmail(input) : passwordResetEmail(input),
  );
}
