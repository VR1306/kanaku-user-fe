import type { NextRequest } from "next/server";
import { notificationsQuerySchema } from "@/features/notifications/schemas";
import { apiError, apiOk } from "@/lib/api-response";
import { getSession } from "@/lib/session";
import { listNotifications } from "@/services/notifications-service";

/** GET /api/notifications?filter=all|unread : newest first, plus the unread count. */
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return apiError(401, "unauthenticated", "Please log in to continue.");
  const parsed = notificationsQuerySchema.safeParse({
    filter: request.nextUrl.searchParams.get("filter") ?? undefined,
  });
  if (!parsed.success) return apiError(400, "invalid_query", "Invalid request.");
  return apiOk(await listNotifications(session.id, parsed.data.filter), { source: "database" });
}
