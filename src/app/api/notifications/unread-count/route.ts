import { apiError, apiOk } from "@/lib/api-response";
import { getSession } from "@/lib/session";
import { unreadCount } from "@/services/notifications-service";

/** GET /api/notifications/unread-count : for the sidebar badge. */
export async function GET() {
  const session = await getSession();
  if (!session) return apiError(401, "unauthenticated", "Please log in to continue.");
  return apiOk({ unreadCount: await unreadCount(session.id) }, { source: "database" });
}
