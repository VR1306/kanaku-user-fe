import type { NextRequest } from "next/server";
import { budgetInputSchema } from "@/features/budgets/schemas";
import { apiError, apiOk } from "@/lib/api-response";
import { isSameOrigin } from "@/lib/same-origin";
import { getSession } from "@/lib/session";
import { notifyBudgetSet } from "@/services/notification-events";
import { deleteBudget, getBudgets, updateBudget } from "@/services/budgets-service";

const unauthenticated = () => apiError(401, "unauthenticated", "Please log in to continue.");
const notFound = () => apiError(404, "not_found", "We couldn't find that budget.");

export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/budgets/[id]">) {
  if (!isSameOrigin(request)) return apiError(403, "forbidden", "Request blocked.");
  const session = await getSession();
  if (!session) return unauthenticated();

  const body = budgetInputSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return apiError(400, "invalid_body", body.error.issues[0]?.message ?? "Invalid budget.");
  }
  const { id } = await ctx.params;
  const result = await updateBudget(session.id, id, body.data);
  if (result.ok) {
    await notifyBudgetSet(session.id, {
      category: body.data.category,
      limit: body.data.limit,
      action: "updated",
    });
    return apiOk({ id }, { source: "database" });
  }
  return result.code === "duplicate"
    ? apiError(409, "duplicate", "You already have a budget for that category.")
    : notFound();
}

export async function DELETE(request: NextRequest, ctx: RouteContext<"/api/budgets/[id]">) {
  if (!isSameOrigin(request)) return apiError(403, "forbidden", "Request blocked.");
  const session = await getSession();
  if (!session) return unauthenticated();
  const { id } = await ctx.params;
  const existing = (await getBudgets(session.id)).items.find((b) => b.id === id);
  if (!(await deleteBudget(session.id, id))) return notFound();
  if (existing) {
    await notifyBudgetSet(session.id, {
      category: existing.category,
      limit: existing.baseLimit,
      action: "removed",
    });
  }
  return apiOk({ id }, { source: "database" });
}
