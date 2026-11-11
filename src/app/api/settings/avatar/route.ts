import type { NextRequest } from "next/server";
import { avatarInputSchema } from "@/features/settings/schemas";
import { apiError, apiOk } from "@/lib/api-response";
import { isSameOrigin } from "@/lib/same-origin";
import { getSession } from "@/lib/session";
import { setAvatar } from "@/services/settings-service";

/** PUT /api/settings/avatar  body: { dataUrl } (a small JPEG made in the browser) */
export async function PUT(request: NextRequest) {
  if (!isSameOrigin(request)) return apiError(403, "forbidden", "Request blocked.");
  const session = await getSession();
  if (!session) return apiError(401, "unauthenticated", "Please log in to continue.");
  const body = avatarInputSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return apiError(400, "invalid_body", body.error.issues[0]?.message ?? "Invalid photo.");
  }
  await setAvatar(session.id, body.data.dataUrl);
  return apiOk({ ok: true as const }, { source: "database" });
}

/** DELETE /api/settings/avatar : back to the initials avatar. */
export async function DELETE(request: NextRequest) {
  if (!isSameOrigin(request)) return apiError(403, "forbidden", "Request blocked.");
  const session = await getSession();
  if (!session) return apiError(401, "unauthenticated", "Please log in to continue.");
  await setAvatar(session.id, null);
  return apiOk({ ok: true as const }, { source: "database" });
}
