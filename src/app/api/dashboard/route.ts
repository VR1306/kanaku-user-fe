import { moduleBlocked } from "@/lib/module-guard";
import type { NextRequest } from "next/server";
import { dashboardQuerySchema } from "@/features/dashboard/schemas";
import { apiError, apiOk } from "@/lib/api-response";
import { getSession } from "@/lib/session";
import { currentMonthKey, getDashboard } from "@/services/dashboard-service";

/** GET /api/dashboard?month=YYYY-MM : dashboard figures for the signed-in user. */
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return apiError(401, "unauthenticated", "Please log in to continue.");
  const blocked = await moduleBlocked(session.id, "dashboard");
  if (blocked) return blocked;

  const parsed = dashboardQuerySchema.safeParse({
    month: request.nextUrl.searchParams.get("month") ?? undefined,
  });
  if (!parsed.success) {
    return apiError(400, "invalid_query", parsed.error.issues[0]?.message ?? "Invalid request.");
  }

  const now = new Date();
  const month = parsed.data.month ?? currentMonthKey(now);
  if (month > currentMonthKey(now)) {
    return apiError(400, "invalid_query", "Choose the current month or an earlier one.");
  }
  return apiOk(await getDashboard(session.id, month, now), { source: "database" });
}
