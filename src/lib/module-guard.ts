import "server-only";
import { redirect } from "next/navigation";
import { MODULES, type ModuleKey } from "@/constants/modules";
import { ROUTES } from "@/constants/routes";
import { apiError } from "@/lib/api-response";
import { getSession } from "@/lib/session";
import { canUse, getEntitlements } from "@/services/entitlements-service";

/** For pages: send customers whose plan doesn't include the module to Plan & billing, saying which one. */
export async function requireModule(module: ModuleKey): Promise<void> {
  const session = await getSession();
  if (!session) redirect(ROUTES.login);
  if (!canUse(await getEntitlements(session.id), module))
    redirect(`${ROUTES.settings}?section=billing&locked=${module}`);
}

/** For API routes: a 403 `plan_required` response when the plan doesn't include the module, otherwise null. */
export async function moduleBlocked(userId: string, module: ModuleKey): Promise<Response | null> {
  const e = await getEntitlements(userId);
  return canUse(e, module)
    ? null
    : apiError(
        403,
        "plan_required",
        `${MODULES[module].label} isn't included in your ${e.planName} plan. Upgrade to unlock it.`,
      );
}

/** 403 `plan_limit` when the plan's budget allowance is used up. */
export const budgetLimitResponse = (planName: string, max: number) =>
  apiError(
    403,
    "plan_limit",
    `Your ${planName} plan includes up to ${max} budgets. Upgrade to add more.`,
  );
