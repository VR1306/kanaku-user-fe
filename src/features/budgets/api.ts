import { z } from "zod";
import { API_ROUTES } from "@/constants/api";
import { apiGet, apiSend } from "@/services/api-client";
import { budgetsOverviewSchema, type BudgetInput } from "./schemas";

export const fetchBudgets = (signal?: AbortSignal) =>
  apiGet(API_ROUTES.budgets, budgetsOverviewSchema, signal);

const created = z.object({ id: z.string() });

export const createBudget = (input: BudgetInput) =>
  apiSend("POST", API_ROUTES.budgets, created, input);

const itemUrl = (id: string) => `${API_ROUTES.budgets}/${encodeURIComponent(id)}`;

export const updateBudget = (id: string, input: BudgetInput) =>
  apiSend("PATCH", itemUrl(id), created, input);

export const deleteBudget = (id: string) => apiSend("DELETE", itemUrl(id), created);

export const updateBudgetSettings = (patch: { overallLimit?: number; alertsEnabled?: boolean }) =>
  apiSend("PATCH", `${API_ROUTES.budgets}/settings`, z.object({ ok: z.literal(true) }), patch);
