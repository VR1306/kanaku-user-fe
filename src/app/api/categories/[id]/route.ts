import type { NextRequest } from "next/server";
import { categoryInputSchema } from "@/features/categories/schemas";
import { apiError, apiOk } from "@/lib/api-response";
import { isSameOrigin } from "@/lib/same-origin";
import { getSession } from "@/lib/session";
import { deleteCategory, updateCategory } from "@/services/categories-service";

const unauthenticated = () => apiError(401, "unauthenticated", "Please log in to continue.");
const notFound = () => apiError(404, "not_found", "We couldn't find that category.");
const protectedCategory = () =>
  apiError(409, "protected", "This is the fallback category, so it can't be renamed or deleted.");

export async function PUT(request: NextRequest, ctx: RouteContext<"/api/categories/[id]">) {
  if (!isSameOrigin(request)) return apiError(403, "forbidden", "Request blocked.");
  const session = await getSession();
  if (!session) return unauthenticated();

  const body = categoryInputSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return apiError(400, "invalid_body", body.error.issues[0]?.message ?? "Invalid category.");
  }
  const { id } = await ctx.params;
  const result = await updateCategory(session.id, id, body.data);
  if (result.ok) return apiOk({ id }, { source: "database" });
  if (result.code === "duplicate") {
    return apiError(409, "duplicate", "You already have a category with that name.");
  }
  return result.code === "protected" ? protectedCategory() : notFound();
}

export async function DELETE(request: NextRequest, ctx: RouteContext<"/api/categories/[id]">) {
  if (!isSameOrigin(request)) return apiError(403, "forbidden", "Request blocked.");
  const session = await getSession();
  if (!session) return unauthenticated();
  const { id } = await ctx.params;
  const result = await deleteCategory(session.id, id);
  if (result.ok) return apiOk({ id, movedTo: result.value.movedTo }, { source: "database" });
  return result.code === "protected" ? protectedCategory() : notFound();
}
