/**
 * Identity service backed by MongoDB (collections: users, auth_codes, mfa_attempts).
 * Passwords are scrypt-hashed, authenticator secrets are encrypted at rest, e-mail codes are
 * hashed and expire on their own (TTL index).
 */
import { CODE_LENGTH, CODE_TTL_MS, MFA_LOCK_MS, MFA_MAX_ATTEMPTS } from "@/constants/auth";
import { randomBytes, randomInt, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { decrypt, encrypt, hashCode } from "@/lib/crypto";
import { getDb, isDuplicateKey } from "@/lib/mongo";
import { syncUser } from "./admin-sync";
import { buildOtpauthUri, generateSecret, verifyTotp } from "@/lib/totp";
import type { CodePurpose, ServiceResult, SessionUser } from "@/types/auth";

type UserDoc = {
  _id: string;
  name: string;
  email: string;
  passwordHash: string;
  verified: boolean;
  mfaEnabled: boolean;
  /** Encrypted (AES-256-GCM). */
  mfaSecret?: string;
  pendingMfaSecret?: string;
  /** Last accepted TOTP step, so a code can't be used twice. */
  lastTotpStep?: number;
  createdAt: Date;
};
type CodeDoc = { _id: string; hash: string; expiresAt: Date };
type AttemptDoc = { _id: string; count: number; lockedUntil: Date };

async function collections() {
  const db = await getDb();
  return {
    users: db.collection<UserDoc>("users"),
    codes: db.collection<CodeDoc>("auth_codes"),
    attempts: db.collection<AttemptDoc>("mfa_attempts"),
  };
}

const norm = (email: string) => email.trim().toLowerCase();
const fail = (error: string, field?: string): ServiceResult<never> => ({ ok: false, error, field });
const toUser = ({ _id, name, email }: UserDoc): SessionUser => ({ id: _id, name, email });

function hash(password: string): string {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 32).toString("hex")}`;
}

function matches(password: string, stored: string): boolean {
  const [salt, key] = stored.split(":");
  const candidate = scryptSync(password, salt, 32);
  return timingSafeEqual(candidate, Buffer.from(key, "hex"));
}

/** Issues a code and returns when it expires. Never reveals whether the account exists. */
export async function sendCode(
  email: string,
  purpose: CodePurpose,
): Promise<{ expiresAt: number; code?: string; name?: string }> {
  const { users, codes } = await collections();
  const value = String(randomInt(10 ** (CODE_LENGTH - 1), 10 ** CODE_LENGTH));
  const expiresAt = Date.now() + CODE_TTL_MS;
  const address = norm(email);
  await codes.replaceOne(
    { _id: `${purpose}:${address}` },
    { hash: hashCode(value), expiresAt: new Date(expiresAt) },
    { upsert: true },
  );
  const user = await users.findOne({ email: address });
  // The code is only handed back for real accounts, so the caller can e-mail it.
  return { expiresAt, ...(user && { code: value, name: user.name }) };
}

async function consumeCode(
  email: string,
  purpose: CodePurpose,
  code: string,
): Promise<string | null> {
  const { codes } = await collections();
  const _id = `${purpose}:${norm(email)}`;
  const record = await codes.findOne({ _id });
  if (!record || record.expiresAt.getTime() < Date.now()) {
    return "This code has expired. Request a new one.";
  }
  if (record.hash !== hashCode(code)) return "That code is incorrect.";
  await codes.deleteOne({ _id });
  return null;
}

export async function register(input: {
  name: string;
  email: string;
  password: string;
}): Promise<ServiceResult<{ expiresAt: number; code?: string; name?: string }>> {
  const { users } = await collections();
  const email = norm(input.email);
  const existing = await users.findOne({ email });
  if (existing?.verified) return fail("An account with this email already exists.", "email");
  try {
    await users.updateOne(
      { email },
      {
        $set: { name: input.name.trim(), passwordHash: hash(input.password), verified: false },
        $setOnInsert: {
          _id: randomUUID(),
          email,
          mfaEnabled: false,
          createdAt: new Date(),
        },
      },
      { upsert: true },
    );
  } catch (error) {
    if (isDuplicateKey(error)) return fail("An account with this email already exists.", "email");
    throw error;
  }
  return { ok: true, data: await sendCode(email, "verify") };
}

export async function verifyEmail(
  email: string,
  code: string,
): Promise<ServiceResult<SessionUser>> {
  const { users } = await collections();
  const user = await users.findOne({ email: norm(email) });
  if (!user) return fail("We couldn't find that account.");
  const problem = await consumeCode(email, "verify", code);
  if (problem) return fail(problem, "code");
  await users.updateOne({ _id: user._id }, { $set: { verified: true } });
  syncUser(user._id); // the Admin Portal learns about the new, verified user
  return { ok: true, data: toUser(user) };
}

export async function login(
  emailInput: string,
  password: string,
): Promise<ServiceResult<{ user: SessionUser; verified: boolean; mfaEnabled: boolean }>> {
  const { users } = await collections();
  const user = await users.findOne({ email: norm(emailInput) });
  if (!user || !matches(password, user.passwordHash)) return fail("Incorrect email or password.");
  return {
    ok: true,
    data: { user: toUser(user), verified: user.verified, mfaEnabled: user.mfaEnabled },
  };
}

export async function resetPassword(
  email: string,
  code: string,
  password: string,
): Promise<ServiceResult<null>> {
  const { users } = await collections();
  const user = await users.findOne({ email: norm(email) });
  const problem = await consumeCode(email, "reset", code);
  if (!user || problem) return fail(problem ?? "That code is incorrect.", "code");
  await users.updateOne({ _id: user._id }, { $set: { passwordHash: hash(password) } });
  return { ok: true, data: null };
}

// ---- Multi-factor authentication (TOTP) ----

const TOO_MANY = "Too many incorrect codes. Try again in a few minutes.";
const BAD_CODE = "That code is incorrect or has expired.";

async function lockedOut(email: string): Promise<boolean> {
  const { attempts } = await collections();
  const entry = await attempts.findOne({ _id: norm(email) });
  return (entry?.lockedUntil.getTime() ?? 0) > Date.now();
}

async function recordFailure(email: string) {
  const { attempts } = await collections();
  const _id = norm(email);
  const entry = await attempts.findOne({ _id });
  const count = (entry?.count ?? 0) + 1;
  const locked = count >= MFA_MAX_ATTEMPTS;
  await attempts.replaceOne(
    { _id },
    {
      count: locked ? 0 : count,
      lockedUntil: new Date(locked ? Date.now() + MFA_LOCK_MS : 0),
    },
    { upsert: true },
  );
}

/** Creates (or reuses) a not-yet-confirmed secret and the otpauth:// URI for the QR code. */
export async function beginMfaSetup(
  email: string,
): Promise<ServiceResult<{ secret: string; uri: string }>> {
  const { users } = await collections();
  const user = await users.findOne({ email: norm(email) });
  if (!user) return fail("We couldn't find that account.");
  if (user.mfaEnabled) return fail("Authenticator is already set up for this account.");
  let secret = user.pendingMfaSecret ? decrypt(user.pendingMfaSecret) : null;
  if (!secret) {
    secret = generateSecret();
    await users.updateOne({ _id: user._id }, { $set: { pendingMfaSecret: encrypt(secret) } });
  }
  return { ok: true, data: { secret, uri: buildOtpauthUri(secret, user.email) } };
}

/** Confirms the first code from the app, which switches MFA on. */
export async function confirmMfaSetup(
  email: string,
  code: string,
): Promise<ServiceResult<SessionUser>> {
  const { users } = await collections();
  const user = await users.findOne({ email: norm(email) });
  if (!user?.pendingMfaSecret) return fail("Start the authenticator setup again.");
  if (await lockedOut(email)) return fail(TOO_MANY, "code");
  const step = verifyTotp(decrypt(user.pendingMfaSecret), code);
  if (step === null) {
    await recordFailure(email);
    return fail(BAD_CODE, "code");
  }
  await users.updateOne(
    { _id: user._id },
    {
      $set: { mfaSecret: user.pendingMfaSecret, mfaEnabled: true, lastTotpStep: step },
      $unset: { pendingMfaSecret: "" },
    },
  );
  return { ok: true, data: toUser(user) };
}

/** Second step of log in. */
export async function verifyMfaLogin(
  email: string,
  code: string,
): Promise<ServiceResult<SessionUser>> {
  const { users } = await collections();
  const user = await users.findOne({ email: norm(email) });
  if (!user?.mfaEnabled || !user.mfaSecret) {
    return fail("Authenticator isn't set up for this account.");
  }
  if (await lockedOut(email)) return fail(TOO_MANY, "code");
  const step = verifyTotp(decrypt(user.mfaSecret), code, { afterStep: user.lastTotpStep });
  if (step === null) {
    await recordFailure(email);
    return fail(BAD_CODE, "code");
  }
  await users.updateOne({ _id: user._id }, { $set: { lastTotpStep: step } });
  return { ok: true, data: toUser(user) };
}

/** Whether this account still exists (and is verified). Guards against stale session cookies. */
export async function userExists(id: string): Promise<boolean> {
  const { users } = await collections();
  return (await users.countDocuments({ _id: id, verified: true }, { limit: 1 })) > 0;
}

/** True if `password` is the account's current password. */
export async function verifyPassword(userId: string, password: string): Promise<boolean> {
  const { users } = await collections();
  const user = await users.findOne({ _id: userId });
  return Boolean(user && matches(password, user.passwordHash));
}

export async function setPassword(userId: string, password: string): Promise<void> {
  const { users } = await collections();
  await users.updateOne({ _id: userId }, { $set: { passwordHash: hash(password) } });
}
