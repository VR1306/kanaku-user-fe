import { API_ROUTES } from "@/constants/api";
import { apiGet } from "@/services/api-client";
import { dashboardSchema, type DashboardMeta } from "./schemas";

/** Fetches the dashboard for a month ("YYYY-MM") through the BFF. */
export function fetchDashboard(month: string, signal?: AbortSignal) {
  return apiGet(
    `${API_ROUTES.dashboard}?month=${encodeURIComponent(month)}`,
    dashboardSchema,
    signal,
  ).then((result) => ({ data: result.data, meta: result.meta as DashboardMeta | undefined }));
}
