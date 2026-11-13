/**
 * Sign-in sessions backed by MongoDB (collection: sessions). Every login creates one; the signed
 * cookie carries its id. Deleting the document signs that device out immediately, and expired
 * ones remove themselves (TTL index).
 */
import { getDb } from "@/lib/mongo";
import { ttlCache } from "@/lib/ttl";
import { randomUUID } from "node:crypto";

type SessionDoc = {
  _id: string;
  userId: string;
  device: string;
  createdAt: Date;
  lastSeenAt: Date;
  expiresAt: Date;
};
type UserLite = { _id: string; name: string; email: string; verified: boolean };

const TOUCH_AFTER_MS = 5 * 60_000;

async function sessions() {
  return (await getDb()).collection<SessionDoc>("sessions");
}

/** "Chrome on Windows" from a User-Agent header. */
export function deviceFromUserAgent(ua: string | null | undefined): string {
  if (!ua) return "Unknown device";
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /OPR\/|Opera/.test(ua)
      ? "Opera"
      : /Firefox\//.test(ua)
        ? "Firefox"
        : /Chrome\//.test(ua)
          ? "Chrome"
          : /Safari\//.test(ua)
            ? "Safari"
            : "Browser";
  const os = /iPhone|iPad|iPod/.test(ua)
    ? "iPhone"
    : /Android/.test(ua)
      ? "Android"
      : /Windows/.test(ua)
        ? "Windows"
        : /Mac OS X|Macintosh/.test(ua)
          ? "Mac"
          : /Linux/.test(ua)
            ? "Linux"
            : "";
  return os ? `${browser} on ${os}` : browser;
}

export async function createSessionRecord(
  userId: string,
  userAgent: string | null | undefined,
  ttlSec: number,
): Promise<string> {
  const id = randomUUID();
  const now = new Date();
  await (
    await sessions()
  ).insertOne({
    _id: id,
    userId,
    device: deviceFromUserAgent(userAgent),
    createdAt: now,
    lastSeenAt: now,
    expiresAt: new Date(now.getTime() + ttlSec * 1000),
  });
  return id;
}

// A valid session is remembered for 5 s so it isn't re-checked on every request/API call of a page view.
// Signing a device out, or editing the profile, clears it at once on this instance.
export const validSessions = ttlCache<{ name: string; email: string }>(5_000);

/** The account behind a live session, or null if the session was ended or the account is gone. */
export async function validateSession(
  sid: string,
  userId: string,
): Promise<{ name: string; email: string } | null> {
  const key = `${sid}:${userId}`;
  const hit = validSessions.get(key);
  if (hit) return hit;
  const db = await getDb();
  // The session and the account are independent lookups: run them together (one round trip, not two).
  const [session, user] = await Promise.all([
    db.collection<SessionDoc>("sessions").findOne({ _id: sid, userId }),
    db.collection<UserLite>("users").findOne({ _id: userId, verified: true }),
  ]);
  if (!session || session.expiresAt.getTime() < Date.now() || !user) return null;
  if (Date.now() - session.lastSeenAt.getTime() > TOUCH_AFTER_MS) {
    // Housekeeping only: don't make the request wait for it.
    void db
      .collection<SessionDoc>("sessions")
      .updateOne({ _id: sid }, { $set: { lastSeenAt: new Date() } })
      .catch(() => undefined);
  }
  const who = { name: user.name, email: user.email };
  validSessions.set(key, who);
  return who;
}

export type SessionInfo = {
  id: string;
  device: string;
  signedInAt: string;
  lastSeenAt: string;
  current: boolean;
};

export async function listSessions(userId: string, currentSid: string): Promise<SessionInfo[]> {
  const docs = await (await sessions()).find({ userId }).sort({ lastSeenAt: -1 }).toArray();
  return docs.map((d) => ({
    id: d._id,
    device: d.device,
    signedInAt: d.createdAt.toISOString(),
    lastSeenAt: d.lastSeenAt.toISOString(),
    current: d._id === currentSid,
  }));
}

export async function revokeSession(userId: string, sid: string): Promise<boolean> {
  const ended = (await (await sessions()).deleteOne({ _id: sid, userId })).deletedCount > 0;
  validSessions.clear(); // after the delete, so nothing can re-cache the old session in between
  return ended;
}

export async function revokeAllSessions(userId: string): Promise<void> {
  await (await sessions()).deleteMany({ userId });
  validSessions.clear();
}

/** Signs out every device except the one making the request. Returns how many were ended. */
export async function revokeOtherSessions(userId: string, currentSid: string): Promise<number> {
  const result = await (await sessions()).deleteMany({ userId, _id: { $ne: currentSid } });
  validSessions.clear();
  return result.deletedCount;
}
