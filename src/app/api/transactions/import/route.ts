import { moduleBlocked } from "@/lib/module-guard";
import type { NextRequest } from "next/server";
import { IMPORT_MAX_BYTES } from "@/constants/settings";
import { apiError, apiOk } from "@/lib/api-response";
import { isSameOrigin } from "@/lib/same-origin";
import { getSession } from "@/lib/session";
import { notifyImport } from "@/services/notification-events";
import { importCsv } from "@/services/data-service";

/** POST /api/transactions/import  body: the CSV text (Date, Description, Category, Payment, Type, Amount, ...) */
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return apiError(403, "forbidden", "Request blocked.");
  const session = await getSession();
  if (!session) return apiError(401, "unauthenticated", "Please log in to continue.");
  const blocked = await moduleBlocked(session.id, "transactions");
  if (blocked) return blocked;

  const text = await request.text();
  if (text.length > IMPORT_MAX_BYTES) {
    return apiError(413, "too_large", "That file is too large. Keep it under 1 MB.");
  }
  const result = await importCsv(session.id, text);
  await notifyImport(session.id, result.imported, result.skipped);
  return apiOk(result, { source: "database" });
}
