import type { NextRequest } from "next/server";
import { reportQuerySchema } from "@/features/reports/schemas";
import { apiError } from "@/lib/api-response";
import { getSession } from "@/lib/session";
import { getReport } from "@/services/reports-service";

/** GET /api/reports/export?range= : the period's income and expenses as CSV. */
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return apiError(401, "unauthenticated", "Please log in to continue.");
  const parsed = reportQuerySchema.safeParse({
    range: request.nextUrl.searchParams.get("range") ?? undefined,
  });
  if (!parsed.success) return apiError(400, "invalid_query", "Invalid request.");

  const report = await getReport(session.id, parsed.data.range);
  const unit = report.granularity === "day" ? "Day" : "Month";
  const lines = [
    `${unit},Income,Expenses,Saved`,
    ...report.series.map((p) =>
      [p.key, p.income, p.expenses, Math.round((p.income - p.expenses) * 100) / 100].join(","),
    ),
  ];
  return new Response(lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="kanaku-report-${report.range}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
