import type { NextRequest } from "next/server";
import { articlesQuerySchema } from "@/features/help/schemas";
import { apiError, apiOk } from "@/lib/api-response";
import { getSession } from "@/lib/session";
import { searchArticles } from "@/services/help-service";

/** GET /api/help/articles?q=&topic= : help articles matching a search and/or a topic. */
export async function GET(request: NextRequest) {
  if (!(await getSession())) return apiError(401, "unauthenticated", "Please log in to continue.");
  const p = request.nextUrl.searchParams;
  const parsed = articlesQuerySchema.safeParse({
    q: p.get("q") || undefined,
    topic: p.get("topic") || undefined,
  });
  if (!parsed.success) return apiError(400, "invalid_query", "Invalid request.");
  return apiOk({ items: searchArticles(parsed.data.q, parsed.data.topic) }, { source: "database" });
}
