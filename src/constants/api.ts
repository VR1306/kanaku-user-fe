/** BFF endpoints (Next.js route handlers under src/app/api). */
export const API_ROUTES = {
  dashboard: "/api/dashboard",
  transactions: "/api/transactions",
  budgets: "/api/budgets",
  notifications: "/api/notifications",
  reports: "/api/reports",
  recurring: "/api/recurring",
  categories: "/api/categories",
  settings: "/api/settings",
  billing: "/api/billing",
  help: "/api/help",
  support: "/api/support",
  transactionImpact: "/api/transactions/impact",
  transactionsExport: "/api/transactions/export",
} as const;

export const API_TIMEOUT_MS = 10_000;
