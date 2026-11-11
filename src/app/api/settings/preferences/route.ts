import type { NextRequest } from "next/server";
import { preferencesInputSchema } from "@/features/settings/schemas";
import { apiError, apiOk } from "@/lib/api-response";
import { isSameOrigin } from "@/lib/same-origin";
import { getSession } from "@/lib/session";
import { updatePreferences } from "@/services/settings-service";

/** PATCH /api/settings/preferences */
export async function PATCH(request: NextRequest) {
  if (!isSameOrigin(request)) return apiError(403, "forbidden", "Request blocked.");
  const session = await getSession();
  if (!session) return apiError(401, "unauthenticated", "Please log in to continue.");
  const body = preferencesInputSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return apiError(400, "invalid_body", "Invalid preferences.");
  await updatePreferences(session.id, body.data);
  return apiOk({ ok: true as const }, { source: "database" });
}
