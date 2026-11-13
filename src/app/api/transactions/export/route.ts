import { moduleBlocked } from "@/lib/module-guard";
import type { NextRequest } from "next/server";
import { apiError } from "@/lib/api-response";
import { csvCell as cell } from "@/lib/csv";
import { getSession } from "@/lib/session";
import { parseTransactionsQuery } from "@/lib/transactions-query";
import { exportTransactions } from "@/services/transactions-service";

/** GET /api/transactions/export?...same filters as the list : CSV of every match. */
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return apiError(401, "unauthenticated", "Please log in to continue.");
  const blocked = await moduleBlocked(session.id, "exports");
  if (blocked) return blocked;
  const parsed = parseTransactionsQuery(request.nextUrl.searchParams);
  if (!parsed.success) return apiError(400, "invalid_query", "Invalid request.");

  const rows = (await exportTransactions(session.id, parsed.data)).map((t) =>
    [
      t.date.slice(0, 10),
      cell(t.title),
      cell(t.category),
      cell(t.method),
      t.type,
      String(t.amount),
      cell(t.note),
      t.recurring ? "yes" : "no",
    ].join(","),
  );
  const csv = ["Date,Description,Category,Payment,Type,Amount,Note,Recurring", ...rows].join(
    "\r\n",
  );
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="kanaku-transactions.csv"',
      "Cache-Control": "private, no-store",
    },
  });
}
