import type { NextRequest } from "next/server";
import { apiError, apiOk } from "@/lib/api-response";
import { isSameOrigin } from "@/lib/same-origin";
import { getSession } from "@/lib/session";
import { markAllRead } from "@/services/notifications-service";

/** POST /api/notifications/read-all : mark every notification as read. */
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return apiError(403, "forbidden", "Request blocked.");
  const session = await getSession();
  if (!session) return apiError(401, "unauthenticated", "Please log in to continue.");
  return apiOk({ updated: await markAllRead(session.id) }, { source: "database" });
}
