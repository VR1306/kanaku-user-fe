import { connection } from "next/server";
import { isRazorpayConfigured } from "@/lib/razorpay";
import { getDb } from "@/lib/mongo";

/**
 * GET /api/health : is the app wired up? Open it in a browser after deploying. It reports whether
 * the database can be reached and which settings are present (yes/no only, never the values).
 */
export async function GET() {
  await connection();
  const started = Date.now();
  let database: { ok: boolean; ms: number; problem?: string } = { ok: false, ms: 0 };
  try {
    await (await getDb()).command({ ping: 1 });
    database = { ok: true, ms: Date.now() - started };
  } catch (error) {
    database = {
      ok: false,
      ms: Date.now() - started,
      problem:
        error instanceof Error && error.message.includes("MONGODB_URI is not set")
          ? "MONGODB_URI is not set in this environment."
          : "Can't reach MongoDB. In Atlas, allow access from anywhere under Network Access (0.0.0.0/0), and check MONGODB_URI.",
    };
  }
  const settings = {
    MONGODB_URI: Boolean(process.env.MONGODB_URI),
    SESSION_SECRET: (process.env.SESSION_SECRET ?? "").length >= 32,
    SMTP: Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS),
    RAZORPAY: isRazorpayConfigured(),
    NEXT_PUBLIC_APP_URL: Boolean(process.env.NEXT_PUBLIC_APP_URL),
  };
  return Response.json(
    { ok: database.ok, database, settings },
    { status: database.ok ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
