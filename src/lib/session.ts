import { cache } from "react";
import { cookies, headers } from "next/headers";
import { connection } from "next/server";
import {
  FLOW_COOKIE_NAME,
  FLOW_TTL_SEC,
  SESSION_COOKIE_NAME,
  SESSION_DEFAULT_TTL_SEC,
  SESSION_REMEMBER_TTL_SEC,
} from "@/constants/auth";
import { notifySecurity } from "@/services/notification-events";
import {
  createSessionRecord,
  deviceFromUserAgent,
  validateSession,
} from "@/services/sessions-service";
import type { AuthFlow, Session, SessionUser } from "@/types/auth";
import { decode, encode } from "./token";

const baseOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

/** `remember` = persistent 30-day cookie; otherwise a browser-session cookie. */
export async function createSession(user: SessionUser, remember: boolean) {
  const ttl = remember ? SESSION_REMEMBER_TTL_SEC : SESSION_DEFAULT_TTL_SEC;
  const userAgent = (await headers()).get("user-agent");
  const sid = await createSessionRecord(user.id, userAgent, ttl);
  await notifySecurity(
    user.id,
    "New sign-in",
    `You signed in on ${deviceFromUserAgent(userAgent)}. If that wasn't you, change your password and revoke the session in Settings > Security.`,
    `login:${sid}`,
  );
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, encode({ id: user.id, sid }, ttl), {
    ...baseOptions,
    ...(remember ? { maxAge: SESSION_REMEMBER_TTL_SEC } : {}),
  });
}

const account = cache((sid: string, userId: string) => validateSession(sid, userId));

/**
 * The signed-in user, or null. A valid cookie is not enough: its session must still exist (so
 * "Sign out" on another device takes effect at once) and the account must still exist. Name and
 * e-mail always come from the database, so edits show up immediately.
 */
export async function getSession(): Promise<Session | null> {
  await connection(); // expiry check uses Date.now(), so opt in to request-time rendering first
  const token = decode<{ id?: string; sid?: string }>(
    (await cookies()).get(SESSION_COOKIE_NAME)?.value,
  );
  if (!token?.id || !token.sid) return null; // cookies from before sessions were tracked
  const user = await account(token.sid, token.id);
  return user ? { id: token.id, sid: token.sid, ...user } : null;
}

export async function destroySession() {
  (await cookies()).delete(SESSION_COOKIE_NAME);
}

export async function setFlow(flow: AuthFlow) {
  (await cookies()).set(FLOW_COOKIE_NAME, encode(flow, FLOW_TTL_SEC), baseOptions);
}

export async function getFlow(): Promise<AuthFlow | null> {
  await connection();
  return decode<AuthFlow>((await cookies()).get(FLOW_COOKIE_NAME)?.value);
}

export async function clearFlow() {
  (await cookies()).delete(FLOW_COOKIE_NAME);
}
