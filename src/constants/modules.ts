import { ROUTES } from "./routes";

/**
 * The app's plan-controlled modules. The Admin Portal decides which of them each plan includes (Plans > Customer
 * access); keys must match its catalogue. Settings and Help & support are always available.
 */
export const MODULES = {
  dashboard: { label: "Dashboard", route: ROUTES.dashboard },
  transactions: { label: "Transactions", route: ROUTES.transactions },
  budgets: { label: "Budgets", route: ROUTES.budgets },
  reports: { label: "Reports", route: ROUTES.reports },
  recurring: { label: "Recurring payments", route: ROUTES.recurringPayments },
  categories: { label: "Categories", route: ROUTES.categories },
  notifications: { label: "Notifications", route: ROUTES.notifications },
  /** Downloading transactions and reports (your own data export in Settings is always allowed). */
  exports: { label: "Exports", route: null },
} as const;
export type ModuleKey = keyof typeof MODULES;
export const MODULE_KEYS = Object.keys(MODULES) as ModuleKey[];
export const isModuleKey = (v: string): v is ModuleKey => v in MODULES;

/** The module a page path belongs to (null for always-available pages such as Settings and Help). */
export function moduleForPath(pathname: string): ModuleKey | null {
  for (const key of MODULE_KEYS) {
    const route = MODULES[key].route;
    if (route && (pathname === route || pathname.startsWith(`${route}/`))) return key;
  }
  return null;
}
