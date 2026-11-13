import { budgetLimitResponse, moduleBlocked } from "@/lib/module-guard";
import type { NextRequest } from "next/server";
import { budgetInputSchema } from "@/features/budgets/schemas";
import { apiError, apiOk } from "@/lib/api-response";
import { isSameOrigin } from "@/lib/same-origin";
import { getSession } from "@/lib/session";
import { notifyBudgetSet } from "@/services/notification-events";
import { createBudget, getBudgets } from "@/services/budgets-service";
import { budgetLimitReached, getEntitlements } from "@/services/entitlements-service";

const unauthenticated = () => apiError(401, "unauthenticated", "Please log in to continue.");

/** GET /api/budgets : this month's overall budget and every category budget, with spending. */
export async function GET() {
  const session = await getSession();
  if (!session) return unauthenticated();
  const blocked = await moduleBlocked(session.id, "budgets");
  if (blocked) return blocked;
  return apiOk(await getBudgets(session.id), { source: "database" });
}

/** POST /api/budgets : create a category budget. */
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return apiError(403, "forbidden", "Request blocked.");
  const session = await getSession();
  if (!session) return unauthenticated();
  const blocked = await moduleBlocked(session.id, "budgets");
  if (blocked) return blocked;

  const body = budgetInputSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return apiError(400, "invalid_body", body.error.issues[0]?.message ?? "Invalid budget.");
  }
  if (await budgetLimitReached(session.id, body.data.category)) {
    const e = await getEntitlements(session.id);
    return budgetLimitResponse(e.planName, e.maxBudgets ?? 0);
  }
  const result = await createBudget(session.id, body.data);
  if (!result.ok) {
    return result.code === "duplicate"
      ? apiError(409, "duplicate", "You already have a budget for that category.")
      : apiError(400, "invalid_category", "Choose an expense category.");
  }
  await notifyBudgetSet(session.id, {
    category: body.data.category,
    limit: body.data.limit,
    action: "created",
  });
  return apiOk({ id: result.value.id }, { source: "database" }, 201);
}
