import type { NextRequest } from "next/server";
import { apiError, apiOk } from "@/lib/api-response";
import { isSameOrigin } from "@/lib/same-origin";
import { getSession } from "@/lib/session";
import { notifySecurity } from "@/services/notification-events";
import { revokeOtherSessions } from "@/services/sessions-service";

/** DELETE /api/settings/sessions : sign out every other device. */
export async function DELETE(request: NextRequest) {
  if (!isSameOrigin(request)) return apiError(403, "forbidden", "Request blocked.");
  const session = await getSession();
  if (!session) return apiError(401, "unauthenticated", "Please log in to continue.");
  const ended = await revokeOtherSessions(session.id, session.sid);
  if (ended > 0) {
    await notifySecurity(
      session.id,
      "Other devices signed out",
      `${ended} ${ended === 1 ? "device was" : "devices were"} signed out from Settings > Security.`,
      `revoke-all:${Date.now()}`,
    );
  }
  return apiOk({ ended }, { source: "database" });
}
