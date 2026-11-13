import type { NextRequest } from "next/server";
import { categoryBudgetSchema } from "@/features/categories/schemas";
import { apiError, apiOk } from "@/lib/api-response";
import { budgetLimitResponse, moduleBlocked } from "@/lib/module-guard";
import { isSameOrigin } from "@/lib/same-origin";
import { getSession } from "@/lib/session";
import { setCategoryBudget } from "@/services/categories-service";
import { getEntitlements } from "@/services/entitlements-service";

const unauthenticated = () => apiError(401, "unauthenticated", "Please log in to continue.");

/** PUT /api/categories/:id  body { budget }: the only change a user can make: their monthly budget. */
export async function PUT(request: NextRequest, ctx: RouteContext<"/api/categories/[id]">) {
  if (!isSameOrigin(request)) return apiError(403, "forbidden", "Request blocked.");
  const session = await getSession();
  if (!session) return unauthenticated();
  const body = categoryBudgetSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return apiError(400, "invalid_body", body.error.issues[0]?.message ?? "Invalid budget.");
  }
  const blocked = await moduleBlocked(session.id, "budgets");
  if (blocked) return blocked;
  const { id } = await ctx.params;
  const result = await setCategoryBudget(session.id, id, body.data.budget);
  if (result.ok) return apiOk({ id }, { source: "database" });
  if (result.code === "plan_limit") {
    const e = await getEntitlements(session.id);
    return budgetLimitResponse(e.planName, e.maxBudgets ?? 0);
  }
  return apiError(404, "not_found", "We couldn't find that category.");
}

/** DELETE /api/categories/:id : not available. Categories are removed by the Kanaku admin only. */
export async function DELETE() {
  return apiError(
    403,
    "managed_by_admin",
    "Categories are managed by Kanaku and can't be deleted here.",
  );
}
