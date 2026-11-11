import { z } from "zod";
import { API_ROUTES } from "@/constants/api";
import { apiGet, apiSend } from "@/services/api-client";
import {
  importResultSchema,
  settingsSchema,
  type PreferencesInput,
  type ProfileInput,
} from "./schemas";

const ok = z.object({ ok: z.literal(true) });
const base = API_ROUTES.settings;

export const fetchSettings = (signal?: AbortSignal) => apiGet(base, settingsSchema, signal);
export const saveProfile = (input: ProfileInput) => apiSend("PATCH", `${base}/profile`, ok, input);
export const savePreferences = (input: PreferencesInput) =>
  apiSend("PATCH", `${base}/preferences`, ok, input);
export const uploadAvatar = (dataUrl: string) => apiSend("PUT", `${base}/avatar`, ok, { dataUrl });
export const removeAvatar = () => apiSend("DELETE", `${base}/avatar`, ok);
export const changePassword = (currentPassword: string, newPassword: string) =>
  apiSend("POST", `${base}/password`, ok, { currentPassword, newPassword });
export const endSession = (id: string) =>
  apiSend("DELETE", `${base}/sessions/${encodeURIComponent(id)}`, z.object({ id: z.string() }));
export const endOtherSessions = () =>
  apiSend("DELETE", `${base}/sessions`, z.object({ ended: z.number() }));
export const deleteAccount = (password: string) =>
  apiSend("DELETE", `${base}/account`, ok, { password });
export const exportAllUrl = `${base}/export`;
export const exportCsvUrl = `${base}/export?format=csv`;

/** Sends a CSV file's text to be imported as transactions. */
export async function importTransactionsCsv(text: string) {
  const response = await fetch(`${API_ROUTES.transactions}/import`, {
    method: "POST",
    headers: { "Content-Type": "text/csv", Accept: "application/json" },
    body: text,
  });
  const json = (await response.json().catch(() => null)) as {
    data?: unknown;
    error?: { message?: string };
  } | null;
  if (!response.ok) throw new Error(json?.error?.message ?? "Couldn't import that file.");
  return importResultSchema.parse(json?.data);
}
