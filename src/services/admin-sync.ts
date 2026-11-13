import "server-only";
import { after } from "next/server";
import { adminConfigured, adminFetch } from "@/lib/admin-api";
import { getDb } from "@/lib/mongo";

/**
 * Mirrors this app's users and payments to the Admin Portal (server-to-server) so its directory,
 * announcement audiences, revenue and coupon usage reflect real activity. Never throws and never
 * blocks the user: failures are logged and the next change re-syncs the full record.
 */
type UserRow = {
  _id: string;
  name: string;
  email: string;
  verified?: boolean;
  createdAt?: Date;
  mfaEnabled?: boolean;
};
type Profile = {
  phone?: string;
  emailAnnouncements?: boolean;
  smsAnnouncements?: boolean;
  alertsEnabled?: boolean;
  pushTokens?: string[];
};

function later(work: () => Promise<void>) {
  const safe = () =>
    work().catch((e) => console.error("[admin-sync]", e instanceof Error ? e.message : e));
  try {
    after(safe);
  } catch {
    void safe();
  }
}

export async function syncUserNow(userId: string): Promise<void> {
  if (!adminConfigured() || !process.env.SERVICE_API_KEY) return;
  const db = await getDb();
  const [user, profile, sub] = await Promise.all([
    db.collection<UserRow>("users").findOne({ _id: userId as never }),
    db.collection<Profile & { _id: string }>("profiles").findOne({ _id: userId as never }),
    db
      .collection<{ _id: string; interval: "monthly" | "yearly"; currentEnd: Date }>(
        "subscriptions",
      )
      .findOne({ _id: userId as never, currentEnd: { $gt: new Date() } }),
  ]);
  if (!user) return;
  await adminFetch("/api/v1/service/users/sync", {
    method: "POST",
    service: true,
    body: {
      userId,
      name: user.name,
      email: user.email,
      phone: profile?.phone ?? "",
      plan: sub ? (sub.interval === "yearly" ? "pro_yearly" : "pro_monthly") : "starter",
      status: user.verified === false ? "invited" : "active",
      joined: user.createdAt?.toISOString(),
      renewsOn: sub ? sub.currentEnd.toISOString().slice(0, 10) : null,
      mfa: user.mfaEnabled ?? false,
      notify: {
        inApp: true,
        email: profile?.emailAnnouncements ?? true,
        push: (profile?.pushTokens?.length ?? 0) > 0,
        sms: profile?.smsAnnouncements === true,
      },
      pushTokens: profile?.pushTokens ?? [],
    },
  });
}

/** Fire-and-forget after the response (keeps serverless functions alive until it finishes). */
export const syncUser = (userId: string) => later(() => syncUserNow(userId));

export function recordPayment(p: {
  id: string;
  userId: string;
  plan: string;
  amountPaise: number;
  method: string;
  couponCode?: string;
}) {
  later(async () => {
    if (!adminConfigured() || !process.env.SERVICE_API_KEY) return;
    const user = await (
      await getDb()
    )
      .collection<UserRow>("users")
      .findOne({ _id: p.userId as never }, { projection: { name: 1 } });
    await adminFetch("/api/v1/service/payments/record", {
      method: "POST",
      service: true,
      body: {
        id: p.id,
        userId: p.userId,
        user: user?.name ?? p.userId,
        plan: p.plan,
        amount: p.amountPaise / 100,
        method: p.method,
        status: "paid",
        couponCode: p.couponCode,
      },
    });
    await syncUserNow(p.userId);
  });
}
