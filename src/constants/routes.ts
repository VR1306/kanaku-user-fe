/** Every internal route path. Use these instead of string literals. */
export const ROUTES = {
  home: "/",
  // Auth
  login: "/login",
  signup: "/signup",
  verifyEmail: "/verify-email",
  forgotPassword: "/forgot-password",
  forgotPasswordSent: "/forgot-password/sent",
  resetPassword: "/reset-password",
  mfaSetup: "/mfa/setup",
  mfaVerify: "/mfa/verify",
  terms: "/terms",
  privacy: "/privacy",
  // Authenticated app
  onboarding: "/onboarding",
  dashboard: "/dashboard",
  transactions: "/transactions",
  budgets: "/budgets",
  reports: "/reports",
  recurringPayments: "/recurring-payments",
  categories: "/categories",
  notifications: "/notifications",
  settings: "/settings",
  help: "/help",
  billing: "/billing",
} as const;

/** Route prefixes that require a session (enforced by src/proxy.ts and the (app) layout). */
export const PROTECTED_ROUTES: string[] = [
  ROUTES.dashboard,
  ROUTES.transactions,
  ROUTES.budgets,
  ROUTES.reports,
  ROUTES.recurringPayments,
  ROUTES.categories,
  ROUTES.notifications,
  ROUTES.settings,
  ROUTES.help,
  ROUTES.billing,
  ROUTES.onboarding,
];

export const DEFAULT_AUTHENTICATED_ROUTE = ROUTES.dashboard;

export const transactionNewRoute = `${ROUTES.transactions}/new`;
export const transactionRoute = (id: string) => `${ROUTES.transactions}/${encodeURIComponent(id)}`;
export const transactionEditRoute = (id: string) => `${transactionRoute(id)}/edit`;
