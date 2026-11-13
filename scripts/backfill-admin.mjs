#!/usr/bin/env node
// One-off: mirrors every existing user to the Admin Portal (users sync + recorded payments), so announcements
// and the console's directory/revenue include people who signed up before the integration existed.
//   npm run backfill:admin            (uses .env.local: MONGODB_*, ADMIN_API_URL, SERVICE_API_KEY)
// Safe to re-run: the Admin Portal upserts by user id / payment id.
import { MongoClient } from "mongodb";

const { MONGODB_URI, MONGODB_DB, ADMIN_API_URL, SERVICE_API_KEY } = process.env;
if (!MONGODB_URI || !ADMIN_API_URL || !SERVICE_API_KEY) {
  console.error(
    "Set MONGODB_URI, ADMIN_API_URL and SERVICE_API_KEY (npm run backfill:admin loads .env.local).",
  );
  process.exit(1);
}
const post = async (path, body) => {
  const r = await fetch(`${ADMIN_API_URL.replace(/\/$/, "")}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${SERVICE_API_KEY}` },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`${path} → ${r.status} ${(await r.text()).slice(0, 120)}`);
};

const client = await new MongoClient(MONGODB_URI).connect();
const db = client.db(MONGODB_DB);
const profiles = new Map((await db.collection("profiles").find().toArray()).map((p) => [p._id, p]));
const subs = new Map(
  (
    await db
      .collection("subscriptions")
      .find({ currentEnd: { $gt: new Date() } })
      .toArray()
  ).map((s) => [s._id, s]),
);
let users = 0,
  payments = 0,
  failed = 0;
for (const u of await db.collection("users").find().toArray()) {
  const p = profiles.get(u._id) ?? {};
  const s = subs.get(u._id);
  try {
    await post("/api/v1/service/users/sync", {
      userId: u._id,
      name: u.name,
      email: u.email,
      phone: p.phone ?? "",
      plan: s ? (s.interval === "yearly" ? "pro_yearly" : "pro_monthly") : "starter",
      status: u.verified === false ? "invited" : "active",
      joined: u.createdAt?.toISOString(),
      renewsOn: s ? s.currentEnd.toISOString().slice(0, 10) : null,
      mfa: !!u.mfaEnabled,
      notify: {
        inApp: true,
        email: p.emailAnnouncements ?? true,
        push: (p.pushTokens?.length ?? 0) > 0,
        sms: p.smsAnnouncements === true,
      },
      pushTokens: p.pushTokens ?? [],
    });
    users++;
  } catch (e) {
    failed++;
    console.error(`user ${u._id}: ${e.message}`);
  }
  for (const pay of await db.collection("billing_payments").find({ userId: u._id }).toArray()) {
    try {
      await post("/api/v1/service/payments/record", {
        id: pay._id,
        userId: u._id,
        user: u.name,
        plan: pay.description,
        amount: pay.amountPaise / 100,
        method: pay.method,
        status: "paid",
        at: pay.paidAt.toISOString(),
      });
      payments++;
    } catch (e) {
      failed++;
      console.error(`payment ${pay._id}: ${e.message}`);
    }
  }
}
console.log(`Synced ${users} users and ${payments} payments${failed ? `, ${failed} failed` : ""}.`);
await client.close();
