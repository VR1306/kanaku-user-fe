"use server";

import { MFA_FLOW_MS } from "@/constants/auth";
import { DEFAULT_AUTHENTICATED_ROUTE, ROUTES } from "@/constants/routes";
import { redirect } from "next/navigation";
import {
  clearFlow,
  createSession,
  destroySession,
  getFlow,
  getSession,
  setFlow,
} from "@/lib/session";
import { revokeSession } from "@/services/sessions-service";
import { guarded } from "@/lib/action-guard";
import * as auth from "@/services/auth-service";
import type { AuthFlow, CodePurpose, FlowPurpose, SessionUser } from "@/types/auth";
import type { ActionResult } from "@/types/forms";
import { zodFieldErrors } from "@/utils/zod";
import { deliverCode } from "./email-delivery";
import {
  forgotPasswordSchema,
  loginSchema,
  mfaCodeSchema,
  resetPasswordSchema,
  signupSchema,
  verifyEmailSchema,
  type ForgotPasswordInput,
  type LoginInput,
  type MfaCodeInput,
  type ResetPasswordInput,
  type SignupInput,
  type VerifyEmailInput,
} from "./schemas";

const EMAIL_FAILED = "We couldn't send the email right now. Please try again in a moment.";

// Inputs come from the client but are never trusted: every action re-validates with the same schema.

async function startFlow(
  email: string,
  purpose: FlowPurpose,
  expiresAt: number,
  extra: Pick<AuthFlow, "remember" | "next"> = {},
) {
  await setFlow({ email, purpose, sentAt: Date.now(), expiresAt, ...extra });
}

/** Hands the user to the authenticator step; nothing grants a session until a valid code is entered. */
async function startMfaFlow(
  email: string,
  purpose: "mfa" | "mfa-setup",
  extra: Pick<AuthFlow, "remember" | "next"> = {},
) {
  await startFlow(email, purpose, Date.now() + MFA_FLOW_MS, extra);
  redirect(purpose === "mfa" ? ROUTES.mfaVerify : ROUTES.mfaSetup);
}

/** Only allow same-site relative redirects. */
function safeNext(value?: string): string {
  return value && value.startsWith("/") && !value.startsWith("//")
    ? value
    : DEFAULT_AUTHENTICATED_ROUTE;
}

export async function signupAction(input: SignupInput): Promise<ActionResult> {
  return guarded(async () => {
    const parsed = signupSchema.safeParse(input);
    if (!parsed.success) return { errors: zodFieldErrors(parsed.error) };
    const { name, email, password } = parsed.data;

    const result = await auth.register({ name, email, password });
    if (!result.ok) return { errors: { [result.field ?? "email"]: result.error } };
    if (!(await deliverCode(email, "verify", result.data))) {
      return { message: EMAIL_FAILED };
    }
    await startFlow(email, "verify", result.data.expiresAt);
    redirect(ROUTES.verifyEmail);
  });
}

export async function verifyEmailAction(input: VerifyEmailInput): Promise<ActionResult> {
  return guarded(async () => {
    const flow = await getFlow();
    if (!flow || flow.purpose !== "verify") redirect(ROUTES.signup);
    const parsed = verifyEmailSchema.safeParse(input);
    if (!parsed.success) return { errors: zodFieldErrors(parsed.error) };

    const result = await auth.verifyEmail(flow.email, parsed.data.code);
    if (!result.ok) return { errors: { code: result.error } };
    await startMfaFlow(flow.email, "mfa-setup", { remember: true });
  });
}

export async function loginAction(input: LoginInput): Promise<ActionResult> {
  return guarded(async () => {
    const parsed = loginSchema.safeParse(input);
    if (!parsed.success) return { errors: zodFieldErrors(parsed.error) };
    const { email, password, remember, next } = parsed.data;

    const result = await auth.login(email, password);
    if (!result.ok) return { message: result.error };

    if (!result.data.verified) {
      const issued = await auth.sendCode(email, "verify");
      if (!(await deliverCode(email, "verify", issued))) return { message: EMAIL_FAILED };
      await startFlow(email, "verify", issued.expiresAt);
      redirect(ROUTES.verifyEmail);
    }
    // Password alone never signs the user in: an authenticator code is always required.
    await startMfaFlow(email, result.data.mfaEnabled ? "mfa" : "mfa-setup", { remember, next });
  });
}

export async function forgotPasswordAction(input: ForgotPasswordInput): Promise<ActionResult> {
  return guarded(async () => {
    const parsed = forgotPasswordSchema.safeParse(input);
    if (!parsed.success) return { errors: zodFieldErrors(parsed.error) };
    const { email } = parsed.data;
    // Same response whether or not the account exists (no account enumeration).
    const issued = await auth.sendCode(email, "reset");
    const sent = await deliverCode(email, "reset", issued);
    if (!sent) return { message: EMAIL_FAILED };
    await startFlow(email, "reset", issued.expiresAt);
    redirect(ROUTES.forgotPasswordSent);
  });
}

export async function resetPasswordAction(input: ResetPasswordInput): Promise<ActionResult> {
  return guarded(async () => {
    const flow = await getFlow();
    if (!flow || flow.purpose !== "reset") redirect(ROUTES.forgotPassword);
    const parsed = resetPasswordSchema.safeParse(input);
    if (!parsed.success) return { errors: zodFieldErrors(parsed.error) };

    const result = await auth.resetPassword(flow.email, parsed.data.code, parsed.data.password);
    if (!result.ok) return { errors: { [result.field ?? "code"]: result.error } };
    await clearFlow();
    redirect(`${ROUTES.login}?reset=1`);
  });
}

/** Re-sends the code for the current flow. Returns the new expiry for the UI timers. */
export async function resendCodeAction(): Promise<{ ok: boolean; expiresAt?: number }> {
  const flow = await getFlow();
  if (!flow || (flow.purpose !== "verify" && flow.purpose !== "reset")) return { ok: false };
  const purpose: CodePurpose = flow.purpose;
  const issued = await auth.sendCode(flow.email, purpose);
  if (!(await deliverCode(flow.email, purpose, issued))) return { ok: false };
  const { expiresAt } = issued;
  await startFlow(flow.email, purpose, expiresAt);
  return { ok: true, expiresAt };
}

async function finishLogin(flow: AuthFlow, user: SessionUser) {
  await clearFlow();
  await createSession(user, flow.remember ?? true);
  redirect(safeNext(flow.next));
}

/** Enrolment: the first valid code from the authenticator app turns MFA on and signs the user in. */
export async function confirmMfaSetupAction(input: MfaCodeInput): Promise<ActionResult> {
  return guarded(async () => {
    const flow = await getFlow();
    if (!flow || flow.purpose !== "mfa-setup") redirect(ROUTES.login);
    const parsed = mfaCodeSchema.safeParse(input);
    if (!parsed.success) return { errors: zodFieldErrors(parsed.error) };
    const result = await auth.confirmMfaSetup(flow.email, parsed.data.code);
    if (!result.ok) return { errors: { code: result.error } };
    await finishLogin(flow, result.data);
  });
}

/** Log in, step 2. */
export async function verifyMfaAction(input: MfaCodeInput): Promise<ActionResult> {
  return guarded(async () => {
    const flow = await getFlow();
    if (!flow || flow.purpose !== "mfa") redirect(ROUTES.login);
    const parsed = mfaCodeSchema.safeParse(input);
    if (!parsed.success) return { errors: zodFieldErrors(parsed.error) };
    const result = await auth.verifyMfaLogin(flow.email, parsed.data.code);
    if (!result.ok) return { errors: { code: result.error } };
    await finishLogin(flow, result.data);
  });
}

/** Abandons the sign-up flow so the user can use a different email. */
export async function changeEmailAction() {
  await clearFlow();
  redirect(ROUTES.signup);
}

export async function logoutAction() {
  const session = await getSession();
  if (session) await revokeSession(session.id, session.sid);
  await destroySession();
  redirect(ROUTES.login);
}
