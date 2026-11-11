import { apiError, apiOk } from "@/lib/api-response";
import { getSession } from "@/lib/session";
import { getSettings } from "@/services/settings-service";

/** GET /api/settings : profile, preferences and security (devices) in one go. */
export async function GET() {
  const session = await getSession();
  if (!session) return apiError(401, "unauthenticated", "Please log in to continue.");
  const settings = await getSettings(session.id, session.sid);
  return settings
    ? apiOk(settings, { source: "database" })
    : apiError(404, "not_found", "We couldn't find your account.");
}
