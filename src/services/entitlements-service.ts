import { MODULE_KEYS, isModuleKey, type ModuleKey } from "@/constants/modules";
import { getDb } from "@/lib/mongo";
import { ttlCache } from "@/lib/ttl";
import { adminPlans } from "./billing-pricing";
import { getPlanName } from "./billing-service";

/**
 * What the signed-in customer's plan includes. The Admin Portal owns the rules (Plans > Customer access); this app
 * reads them (cached, refreshed in the background) and applies them to the menu, the pages and the API.
 * If the Admin Portal has never been reachable, access fails OPEN (everything on): a customer who paid must never
 * be locked out of their own data because of an outage.
 */
export type Entitlements = {
  planKey: string;
  planName: string;
  modules: ModuleKey[];
  /** Most category budgets allowed; null = unlimited. */
  maxBudgets: number | null;
};

const cache = ttlCache<Entitlements>(10_000);
/** Call after a plan change (payment) so the new access applies at once. */
export const clearEntitlements = () => cache.clear();

export async function getEntitlements(userId: string): Promise<Entitlements> {
  const hit = cache.get(userId);
  if (hit) return hit;
  const planName = await getPlanName(userId);
  const planKey = planName.toLowerCase();
  let result: Entitlements = { planKey, planName, modules: [...MODULE_KEYS], maxBudgets: null };
  try {
    const plan = (await adminPlans()).find((p) => p.key === planKey);
    if (plan?.modules)
      result = {
        planKey,
        planName: plan.name,
        modules: plan.modules.filter(isModuleKey),
        maxBudgets: plan.maxBudgets ?? null,
      };
  } catch {
    /* admin never reachable: fail open (see above) */
  }
  cache.set(userId, result);
  return result;
}

export const canUse = (e: Entitlements, module: ModuleKey) => e.modules.includes(module);

/** True when adding a budget for `category` would exceed the plan's limit (editing an existing one never does). */
export async function budgetLimitReached(userId: string, category?: string): Promise<boolean> {
  const { maxBudgets } = await getEntitlements(userId);
  if (maxBudgets === null) return false;
  const col = (await getDb()).collection<{ userId: string; category: string }>("budgets");
  if (category && (await col.countDocuments({ userId, category }, { limit: 1 })) > 0) return false;
  return (await col.countDocuments({ userId })) >= maxBudgets;
}
