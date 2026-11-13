import { moduleBlocked } from "@/lib/module-guard";
import type { NextRequest } from "next/server";
import { reportQuerySchema } from "@/features/reports/schemas";
import { apiError, apiOk } from "@/lib/api-response";
import { getSession } from "@/lib/session";
import { getReport } from "@/services/reports-service";

/** GET /api/reports?range=1m|3m|6m|1y */
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return apiError(401, "unauthenticated", "Please log in to continue.");
  const blocked = await moduleBlocked(session.id, "reports");
  if (blocked) return blocked;
  const parsed = reportQuerySchema.safeParse({
    range: request.nextUrl.searchParams.get("range") ?? undefined,
  });
  if (!parsed.success) return apiError(400, "invalid_query", "Choose 1M, 3M, 6M or 1Y.");
  return apiOk(await getReport(session.id, parsed.data.range), { source: "database" });
}
