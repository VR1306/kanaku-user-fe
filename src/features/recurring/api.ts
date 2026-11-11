import { z } from "zod";
import { API_ROUTES } from "@/constants/api";
import { apiGet, apiSend } from "@/services/api-client";
import { recurringListSchema, type RecurringInput } from "./schemas";

const idResult = z.object({ id: z.string() });
const itemUrl = (id: string) => `${API_ROUTES.recurring}/${encodeURIComponent(id)}`;

export const fetchRecurring = (signal?: AbortSignal) =>
  apiGet(API_ROUTES.recurring, recurringListSchema, signal);

export const createRecurring = (input: RecurringInput) =>
  apiSend("POST", API_ROUTES.recurring, idResult, input);

export const updateRecurring = (id: string, input: RecurringInput) =>
  apiSend("PUT", itemUrl(id), idResult, input);

export const setRecurringActive = (id: string, active: boolean) =>
  apiSend("PATCH", itemUrl(id), idResult, { active });

export const deleteRecurring = (id: string) => apiSend("DELETE", itemUrl(id), idResult);
