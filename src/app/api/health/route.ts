import { connection } from "next/server";
import { isRazorpayConfigured } from "@/lib/razorpay";
import { verifyMail } from "@/lib/mailer";
import { describeDbProblem } from "@/lib/db-diagnose";
import { getDb } from "@/lib/mongo";

/**
 * GET /api/health : is the app wired up? Open it in a browser after deploying. It reports whether
 * the database can be reached and which settings are present (yes/no only, never the values).
 */
export async function GET(request: Request) {
  await connection();
  const started = Date.now();
  let database: { ok: boolean; ms: number; code?: string; problem?: string } = { ok: false, ms: 0 };
  try {
    await (await getDb()).command({ ping: 1 });
    database = { ok: true, ms: Date.now() - started };
  } catch (error) {
    const d = describeDbProblem(error);
    database = { ok: false, ms: Date.now() - started, code: d.code, problem: d.message };
  }
  const settings = {
    MONGODB_URI: Boolean(process.env.MONGODB_URI),
    SESSION_SECRET: (process.env.SESSION_SECRET ?? "").length >= 32,
    SMTP: Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS),
    RAZORPAY: isRazorpayConfigured(),
    NEXT_PUBLIC_APP_URL: Boolean(process.env.NEXT_PUBLIC_APP_URL),
    ADMIN_API_URL: Boolean(process.env.ADMIN_API_URL),
    SERVICE_API_KEY: (process.env.SERVICE_API_KEY ?? "").length >= 16,
  };
  // /api/health?mail=1 also tests the e-mail login (nothing is sent).
  const mail = new URL(request.url).searchParams.get("mail") ? await verifyMail() : undefined;
  return Response.json(
    { ok: database.ok && (mail?.ok ?? true), database, settings, ...(mail ? { mail } : {}) },
    { status: database.ok ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
