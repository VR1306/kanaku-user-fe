import { z } from "zod";
import { API_ROUTES } from "@/constants/api";
import { apiGet, apiSend } from "@/services/api-client";
import { categoriesListSchema } from "./schemas";

const idResult = z.object({ id: z.string() });
const itemUrl = (id: string) => `${API_ROUTES.categories}/${encodeURIComponent(id)}`;

export const fetchCategories = (signal?: AbortSignal) =>
  apiGet(API_ROUTES.categories, categoriesListSchema, signal);

/** Categories themselves are managed by the admin; a user can only set their own monthly budget. */
export const setCategoryBudget = (id: string, budget: number | null) =>
  apiSend("PUT", itemUrl(id), idResult, { budget });
