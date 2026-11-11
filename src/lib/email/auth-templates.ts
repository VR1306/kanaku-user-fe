import { CODE_TTL_MS } from "@/constants/auth";
import { renderEmail, type EmailContent } from "./layout";
import { firstName } from "./theme";

type CodeEmailInput = { name?: string; code: string; supportEmail?: string };

const minutes = Math.round(CODE_TTL_MS / 60000);
const NEVER_SHARE = "Never share this code with anyone. Kanaku will never ask you for it.";

export function verificationEmail({ name, code, supportEmail }: CodeEmailInput): EmailContent {
  return renderEmail({
    subject: "Verify your email address for Kanaku",
    preheader: `Use this code to finish creating your Kanaku account. It expires in ${minutes} minutes.`,
    heading: "Verify your email address",
    greeting: `Hi ${firstName(name)},`,
    paragraphs: [
      "Welcome to Kanaku. To finish creating your account, enter the verification code below in the app.",
    ],
    code: {
      value: code,
      note: `This code expires in ${minutes} minutes and can only be used once.`,
    },
    afterParagraphs: [
      "Once your email is verified, you'll set up two-step verification with Google Authenticator to keep your account secure.",
    ],
    note: `${NEVER_SHARE} If you didn't create a Kanaku account, you can safely ignore this email and no account will be activated.`,
    supportEmail,
    reason: "You received this email because this address was used to sign up for Kanaku.",
  });
}

export function passwordResetEmail({ name, code, supportEmail }: CodeEmailInput): EmailContent {
  return renderEmail({
    subject: "Reset your Kanaku password",
    preheader: `Use this code to reset your Kanaku password. It expires in ${minutes} minutes.`,
    heading: "Reset your password",
    greeting: `Hi ${firstName(name)},`,
    paragraphs: [
      "We received a request to reset the password for your Kanaku account. Enter the code below to choose a new password.",
    ],
    code: {
      value: code,
      note: `This code expires in ${minutes} minutes and can only be used once.`,
    },
    afterParagraphs: [
      "For your security, you'll still need your authenticator app to log in after the reset.",
    ],
    note: `${NEVER_SHARE} If you didn't request a password reset, ignore this email and your password will stay the same. Consider changing it if you think someone else has access to your account.`,
    supportEmail,
    reason: "You received this email because a password reset was requested for this address.",
  });
}
