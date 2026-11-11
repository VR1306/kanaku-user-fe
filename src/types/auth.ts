export type SessionUser = { id: string; name: string; email: string };

/** A signed-in user plus the id of this device's session record. */
export type Session = SessionUser & { sid: string };

/** Steps that e-mail a code. */
export type CodePurpose = "verify" | "reset";

/** `mfa-setup`: enrolling an authenticator. `mfa`: entering a code to finish logging in. */
export type FlowPurpose = CodePurpose | "mfa" | "mfa-setup";

/** Short-lived state carried between verify / reset steps. */
export type AuthFlow = {
  email: string;
  purpose: FlowPurpose;
  sentAt: number;
  expiresAt: number;
  /** Carried through MFA so the final session honours the login choices. */
  remember?: boolean;
  next?: string;
};

export type ServiceResult<T> = { ok: true; data: T } | { ok: false; error: string; field?: string };
