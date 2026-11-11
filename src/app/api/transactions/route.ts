import type { NextRequest } from "next/server";
import { idsSchema, transactionInputSchema } from "@/features/transactions/schemas";
import { apiError, apiOk } from "@/lib/api-response";
import { isSameOrigin } from "@/lib/same-origin";
import { getSession } from "@/lib/session";
import { parseTransactionsQuery } from "@/lib/transactions-query";
import { categoryExists } from "@/services/categories-service";
import { notifyTransactionsDeleted } from "@/services/notification-events";
import { notifyTransactionSaved } from "@/services/notifications-service";
import { ensureScheduleFromTransaction } from "@/services/recurring-service";
import {
  createTransaction,
  deleteTransactions,
  getTransaction,
  listTransactions,
} from "@/services/transactions-service";

const UNAUTHENTICATED = () => apiError(401, "unauthenticated", "Please log in to continue.");

/** GET /api/transactions?q=&type=&category=&method=&range=&page=&pageSize= */
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return UNAUTHENTICATED();

  const parsed = parseTransactionsQuery(request.nextUrl.searchParams);
  if (!parsed.success) {
    return apiError(400, "invalid_query", parsed.error.issues[0]?.message ?? "Invalid request.");
  }
  return apiOk(await listTransactions(session.id, parsed.data), { source: "database" });
}

/** POST /api/transactions : create one transaction. */
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return apiError(403, "forbidden", "Request blocked.");
  const session = await getSession();
  if (!session) return UNAUTHENTICATED();

  const body = transactionInputSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return apiError(400, "invalid_body", body.error.issues[0]?.message ?? "Invalid transaction.");
  }
  if (!(await categoryExists(session.id, body.data.type, body.data.category))) {
    return apiError(400, "invalid_body", "Choose one of your categories.");
  }
  const created = await createTransaction(session.id, body.data);
  if (body.data.recurring) {
    await ensureScheduleFromTransaction(session.id, {
      ...body.data,
      date: created.date,
    }).catch((error) => console.error("Couldn't create recurring schedule", error));
  }
  await notifyTransactionSaved(session.id, {
    ...created,
    amount: Math.abs(created.amount),
    recurring: Boolean(created.recurring),
  });
  return apiOk(created, { source: "database" }, 201);
}

/** DELETE /api/transactions  body: { ids: string[] } : bulk delete. */
export async function DELETE(request: NextRequest) {
  if (!isSameOrigin(request)) return apiError(403, "forbidden", "Request blocked.");
  const session = await getSession();
  if (!session) return UNAUTHENTICATED();

  const body = idsSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return apiError(400, "invalid_body", "Choose at least one transaction.");
  const titles = (
    await Promise.all(body.data.ids.map((id) => getTransaction(session.id, id)))
  ).flatMap((t) => (t ? [t.title] : []));
  const deleted = await deleteTransactions(session.id, body.data.ids);
  if (deleted > 0) await notifyTransactionsDeleted(session.id, titles);
  return apiOk({ deleted }, { source: "database" });
}
