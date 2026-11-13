import { apiError, apiOk } from "@/lib/api-response";
import { getSession } from "@/lib/session";
import { listCategories } from "@/services/categories-service";

const unauthenticated = () => apiError(401, "unauthenticated", "Please log in to continue.");

/** GET /api/categories : the categories managed by the Kanaku team, with this month's activity and your budget. */
export async function GET() {
  const session = await getSession();
  if (!session) return unauthenticated();
  return apiOk(
    { currency: "INR", items: await listCategories(session.id) },
    { source: "database" },
  );
}

/** POST /api/categories : not available. Categories are created by the Kanaku admin only. */
export async function POST() {
  return apiError(
    403,
    "managed_by_admin",
    "Categories are managed by Kanaku and can't be created here.",
  );
}
