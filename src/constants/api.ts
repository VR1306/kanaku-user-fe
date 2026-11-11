import { API_BASE } from "./urls";

/**
 * API endpoints (Next.js route handlers under src/app/api). Prefixed with NEXT_PUBLIC_API_URL when
 * the backend lives at its own address; relative otherwise.
 */
export const API_ROUTES = {
  dashboard: `${API_BASE}/api/dashboard`,
  transactions: `${API_BASE}/api/transactions`,
  budgets: `${API_BASE}/api/budgets`,
  notifications: `${API_BASE}/api/notifications`,
  reports: `${API_BASE}/api/reports`,
  recurring: `${API_BASE}/api/recurring`,
  categories: `${API_BASE}/api/categories`,
  settings: `${API_BASE}/api/settings`,
  billing: `${API_BASE}/api/billing`,
  help: `${API_BASE}/api/help`,
  support: `${API_BASE}/api/support`,
  realtimeToken: `${API_BASE}/api/realtime/token`,
  transactionImpact: `${API_BASE}/api/transactions/impact`,
  transactionsExport: `${API_BASE}/api/transactions/export`,
} as const;

export const API_TIMEOUT_MS = 10_000;
