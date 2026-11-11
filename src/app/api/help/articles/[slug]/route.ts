import type { NextRequest } from "next/server";
import { apiError, apiOk } from "@/lib/api-response";
import { getSession } from "@/lib/session";
import { getArticle } from "@/services/help-service";

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/help/articles/[slug]">) {
  if (!(await getSession())) return apiError(401, "unauthenticated", "Please log in to continue.");
  const { slug } = await ctx.params;
  const article = getArticle(slug);
  return article
    ? apiOk(article, { source: "database" })
    : apiError(404, "not_found", "We couldn't find that article.");
}
