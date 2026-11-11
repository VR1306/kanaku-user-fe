import type { NextRequest } from "next/server";
import { categoryInputSchema } from "@/features/categories/schemas";
import { apiError, apiOk } from "@/lib/api-response";
import { isSameOrigin } from "@/lib/same-origin";
import { getSession } from "@/lib/session";
import { createCategory, listCategories } from "@/services/categories-service";

const unauthenticated = () => apiError(401, "unauthenticated", "Please log in to continue.");

/** GET /api/categories : the user's categories with this month's activity. */
export async function GET() {
  const session = await getSession();
  if (!session) return unauthenticated();
  return apiOk(
    { currency: "INR", items: await listCategories(session.id) },
    { source: "database" },
  );
}

/** POST /api/categories : create a category (and an optional monthly budget for an expense one). */
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return apiError(403, "forbidden", "Request blocked.");
  const session = await getSession();
  if (!session) return unauthenticated();

  const body = categoryInputSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return apiError(400, "invalid_body", body.error.issues[0]?.message ?? "Invalid category.");
  }
  const result = await createCategory(session.id, body.data);
  if (!result.ok) return apiError(409, "duplicate", "You already have a category with that name.");
  return apiOk({ id: result.value.id }, { source: "database" }, 201);
}
