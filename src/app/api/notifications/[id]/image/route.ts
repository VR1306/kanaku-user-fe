import { apiError } from "@/lib/api-response";
import { adminFetchRaw } from "@/lib/admin-api";
import { getSession } from "@/lib/session";
import { notificationsCollection } from "@/services/notification-store";

/**
 * GET /api/notifications/:id/image : the picture of an announcement notification. Only its owner can load it; the
 * bytes come from the Admin Portal (service key) and are cached privately by the browser.
 */
export async function GET(_: Request, ctx: RouteContext<"/api/notifications/[id]/image">) {
  const session = await getSession();
  if (!session) return apiError(401, "unauthenticated", "Please log in to continue.");
  const { id } = await ctx.params;
  const n = await (
    await notificationsCollection()
  ).findOne({ _id: id, userId: session.id }, { projection: { announcementId: 1, imageAlt: 1 } });
  if (!n?.announcementId || !n.imageAlt) return apiError(404, "not_found", "No image.");
  let upstream: Response;
  try {
    upstream = await adminFetchRaw(
      `/api/v1/service/announcements/${encodeURIComponent(n.announcementId)}/image`,
    );
  } catch {
    return apiError(502, "unreachable", "The image is temporarily unavailable.");
  }
  if (!upstream.ok || !upstream.body) return apiError(404, "not_found", "No image.");
  return new Response(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "image/jpeg",
      "Cache-Control": "private, max-age=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
