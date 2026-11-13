import { z } from "zod";
import { apiError, apiOk } from "@/lib/api-response";
import { getDb } from "@/lib/mongo";
import { serviceAuthorised } from "@/lib/service-auth";
import { createNotification } from "@/services/notification-store";

const body = z.object({
  userId: z.string().min(1).max(80),
  kind: z.enum(["announcement", "support", "offer"]).default("announcement"),
  title: z.string().trim().min(1).max(120),
  body: z.string().trim().min(1).max(1000),
  href: z
    .string()
    .max(400)
    .regex(/^(\/|https:\/\/)/)
    .nullable()
    .optional(),
  /** Same key => at most one notification (the Admin Portal retries failed deliveries). */
  dedupeKey: z.string().min(1).max(120),
  /** Announcements: the admin's announcement id, the picture's alt text (null = no picture) and the button label. */
  announcementId: z.string().min(1).max(80).optional(),
  image: z
    .object({ alt: z.string().max(200) })
    .nullable()
    .optional(),
  ctaLabel: z.string().max(40).optional(),
});

/**
 * POST /api/integrations/admin/notifications — the Admin Portal delivers an announcement (or a support
 * alert) into a user's notification centre. The existing realtime server then pushes it to their open tabs.
 * Authenticated with the shared SERVICE_API_KEY; never callable by signed-in users.
 */
export async function POST(request: Request) {
  if (!serviceAuthorised(request)) return apiError(401, "unauthenticated", "Invalid service key.");
  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return apiError(400, "invalid_body", parsed.error.issues[0]?.message ?? "Invalid body.");
  const {
    userId,
    kind,
    title,
    body: text,
    href,
    dedupeKey,
    announcementId,
    image,
    ctaLabel,
  } = parsed.data;
  const user = await (
    await getDb()
  )
    .collection("users")
    .findOne({ _id: userId as never }, { projection: { _id: 1 } });
  if (!user) return apiError(404, "not_found", "No such user.");
  const created = await createNotification(userId, {
    kind,
    title,
    body: text,
    href,
    key: dedupeKey,
    ...(announcementId ? { announcementId } : {}),
    ...(announcementId && image ? { imageAlt: image.alt || "Announcement image" } : {}),
    ...(ctaLabel ? { ctaLabel } : {}),
  });
  return apiOk({ created }, { source: "database" });
}
