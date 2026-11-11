import type { NextRequest } from "next/server";
import { apiError } from "@/lib/api-response";
import { getSession } from "@/lib/session";
import { exportAllCsv } from "@/services/data-service";
import { buildWorkbook } from "@/services/export-workbook";

const XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/**
 * GET /api/settings/export?format=xlsx|csv
 * xlsx (default): an Excel workbook with a sheet per part of the app.
 * csv: transactions first, then the other parts, in one file that can be imported back.
 */
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return apiError(401, "unauthenticated", "Please log in to continue.");
  const stamp = new Date().toISOString().slice(0, 10);
  const headers = { "Cache-Control": "private, no-store" };

  if (request.nextUrl.searchParams.get("format") === "csv") {
    return new Response(await exportAllCsv(session.id), {
      headers: {
        ...headers,
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="kanaku-export-${stamp}.csv"`,
      },
    });
  }
  const file = await buildWorkbook(session.id);
  return new Response(new Uint8Array(file), {
    headers: {
      ...headers,
      "Content-Type": XLSX,
      "Content-Disposition": `attachment; filename="kanaku-export-${stamp}.xlsx"`,
    },
  });
}
