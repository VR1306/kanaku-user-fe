import { API_ROUTES } from "@/constants/api";
import type { ReportRange } from "@/constants/reports";
import { apiGet } from "@/services/api-client";
import { reportSchema } from "./schemas";

export const fetchReport = (range: ReportRange, signal?: AbortSignal) =>
  apiGet(`${API_ROUTES.reports}?range=${range}`, reportSchema, signal);

export const reportCsvUrl = (range: ReportRange) => `${API_ROUTES.reports}/export?range=${range}`;
