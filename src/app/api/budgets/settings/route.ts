import { moduleBlocked } from "@/lib/module-guard";
import type { NextRequest } from "next/server";
import { settingsSchema } from "@/features/budgets/schemas";
import { apiError, apiOk } from "@/lib/api-response";
import { isSameOrigin } from "@/lib/same-origin";
import { getSession } from "@/lib/session";
import { notifyBudgetSet } from "@/services/notification-events";
import { updateSettings } from "@/services/budgets-service";

/** PATCH /api/budgets/settings  body: { overallLimit?, alertsEnabled? } */
export async function PATCH(request: NextRequest) {
  if (!isSameOrigin(request)) return apiError(403, "forbidden", "Request blocked.");
  const session = await getSession();
  if (!session) return apiError(401, "unauthenticated", "Please log in to continue.");
  const blocked = await moduleBlocked(session.id, "budgets");
  if (blocked) return blocked;

  const body = settingsSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return apiError(400, "invalid_body", body.error.issues[0]?.message ?? "Invalid settings.");
  }
  await updateSettings(session.id, body.data);
  if (body.data.overallLimit !== undefined) {
    await notifyBudgetSet(session.id, { limit: body.data.overallLimit, action: "overall" });
  }
  return apiOk({ ok: true as const }, { source: "database" });
}
