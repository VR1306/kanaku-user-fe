import type { NextRequest } from "next/server";
import { impactQuerySchema } from "@/features/transactions/schemas";
import { apiError, apiOk } from "@/lib/api-response";
import { getSession } from "@/lib/session";
import { transactionImpact } from "@/services/budgets-service";

/** GET /api/transactions/impact?type=&category=&amount=&excludeId= : budget left after saving. */
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return apiError(401, "unauthenticated", "Please log in to continue.");
  const p = request.nextUrl.searchParams;
  const parsed = impactQuerySchema.safeParse({
    type: p.get("type") ?? undefined,
    category: p.get("category") ?? undefined,
    amount: p.get("amount") || undefined,
    excludeId: p.get("excludeId") || undefined,
  });
  if (!parsed.success) return apiError(400, "invalid_query", "Invalid request.");
  return apiOk(await transactionImpact(session.id, parsed.data), { source: "database" });
}
