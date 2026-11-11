import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Signed, expiring tokens (HMAC-SHA256) used for the session and flow cookies. Kept free of
 * Next.js imports so the standalone realtime server can verify the same session cookie.
 */
function secret(): string {
  const value = process.env.SESSION_SECRET;
  if (value && value.length >= 32) return value;
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET (min 32 chars) must be set in production.");
  }
  return "dev-only-insecure-secret-do-not-use-in-prod";
}

function mac(body: string): string {
  return createHmac("sha256", secret()).update(body).digest("base64url");
}

export function encode(payload: object, ttlSec: number): string {
  const body = Buffer.from(
    JSON.stringify({ ...payload, exp: Date.now() + ttlSec * 1000 }),
  ).toString("base64url");
  return `${body}.${mac(body)}`;
}

export function decode<T>(token: string | undefined): T | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = Buffer.from(mac(body));
  const actual = Buffer.from(sig);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  try {
    const { exp, ...rest } = JSON.parse(Buffer.from(body, "base64url").toString());
    return typeof exp === "number" && exp > Date.now() ? (rest as T) : null;
  } catch {
    return null;
  }
}
