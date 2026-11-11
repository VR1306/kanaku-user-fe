import { z } from "zod";
import { API_ROUTES } from "@/constants/api";
import { apiGet, apiSend } from "@/services/api-client";
import { categoriesListSchema, type CategoryInput } from "./schemas";

const idResult = z.object({ id: z.string() });
const itemUrl = (id: string) => `${API_ROUTES.categories}/${encodeURIComponent(id)}`;

export const fetchCategories = (signal?: AbortSignal) =>
  apiGet(API_ROUTES.categories, categoriesListSchema, signal);

export const createCategory = (input: CategoryInput) =>
  apiSend("POST", API_ROUTES.categories, idResult, input);

export const updateCategory = (id: string, input: CategoryInput) =>
  apiSend("PUT", itemUrl(id), idResult, input);

export const deleteCategory = (id: string) =>
  apiSend("DELETE", itemUrl(id), z.object({ id: z.string(), movedTo: z.string() }));
