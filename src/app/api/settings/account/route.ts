import type { NextRequest } from "next/server";
import { deleteAccountSchema } from "@/features/settings/schemas";
import { apiError, apiOk } from "@/lib/api-response";
import { isSameOrigin } from "@/lib/same-origin";
import { destroySession, getSession } from "@/lib/session";
import { deleteAccount } from "@/services/settings-service";

/** DELETE /api/settings/account  body: { password } : permanently delete the account and its data. */
export async function DELETE(request: NextRequest) {
  if (!isSameOrigin(request)) return apiError(403, "forbidden", "Request blocked.");
  const session = await getSession();
  if (!session) return apiError(401, "unauthenticated", "Please log in to continue.");
  const body = deleteAccountSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return apiError(400, "invalid_body", "Enter your password to confirm.");
  if ((await deleteAccount(session.id, body.data.password)) !== "ok") {
    return apiError(400, "wrong_password", "That password is incorrect.");
  }
  await destroySession();
  return apiOk({ ok: true as const }, { source: "database" });
}
