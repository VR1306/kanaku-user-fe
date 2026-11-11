import type { NextRequest } from "next/server";
import { passwordInputSchema } from "@/features/settings/schemas";
import { apiError, apiOk } from "@/lib/api-response";
import { isSameOrigin } from "@/lib/same-origin";
import { getSession } from "@/lib/session";
import { changePassword } from "@/services/settings-service";

/** POST /api/settings/password : change the password; every other device is signed out. */
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return apiError(403, "forbidden", "Request blocked.");
  const session = await getSession();
  if (!session) return apiError(401, "unauthenticated", "Please log in to continue.");
  const body = passwordInputSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return apiError(400, "invalid_body", body.error.issues[0]?.message ?? "Invalid password.");
  }
  const result = await changePassword(
    session.id,
    session.sid,
    body.data.currentPassword,
    body.data.newPassword,
  );
  return result === "ok"
    ? apiOk({ ok: true as const }, { source: "database" })
    : apiError(400, "wrong_password", "Your current password is incorrect.");
}
