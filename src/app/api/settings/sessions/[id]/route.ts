import type { NextRequest } from "next/server";
import { apiError, apiOk } from "@/lib/api-response";
import { isSameOrigin } from "@/lib/same-origin";
import { getSession } from "@/lib/session";
import { notifySecurity } from "@/services/notification-events";
import { listSessions, revokeSession } from "@/services/sessions-service";

/** DELETE /api/settings/sessions/:id : sign that device out. */
export async function DELETE(
  request: NextRequest,
  ctx: RouteContext<"/api/settings/sessions/[id]">,
) {
  if (!isSameOrigin(request)) return apiError(403, "forbidden", "Request blocked.");
  const session = await getSession();
  if (!session) return apiError(401, "unauthenticated", "Please log in to continue.");
  const { id } = await ctx.params;
  if (id === session.sid) {
    return apiError(400, "current_session", "Use Log out to end this device's session.");
  }
  const device = (await listSessions(session.id, session.sid)).find((s) => s.id === id)?.device;
  if (!(await revokeSession(session.id, id))) {
    return apiError(404, "not_found", "We couldn't find that session.");
  }
  await notifySecurity(
    session.id,
    "Device signed out",
    `${device ?? "A device"} was signed out from Settings > Security.`,
    `revoke:${id}`,
  );
  return apiOk({ id }, { source: "database" });
}
