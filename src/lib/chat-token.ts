import "server-only";
import { createHmac } from "node:crypto";

/**
 * Short-lived connection token for the support-chat realtime service (run by the Admin Portal).
 * Both sides share REALTIME_SECRET; the token proves "this browser belongs to user <id>".
 */
export function mintChatToken(userId: string, ttlS = 300): string {
  const secret = process.env.REALTIME_SECRET;
  if (!secret || secret.length < 32) throw new Error("REALTIME_SECRET (≥ 32 chars) is not set");
  const body = Buffer.from(
    JSON.stringify({ kind: "user", id: userId, exp: Date.now() + ttlS * 1000 }),
  ).toString("base64url");
  return `${body}.${createHmac("sha256", secret).update(body).digest("base64url")}`;
}
