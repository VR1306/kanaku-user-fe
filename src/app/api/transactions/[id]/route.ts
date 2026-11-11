import type { NextRequest } from "next/server";
import { transactionInputSchema } from "@/features/transactions/schemas";
import { apiError, apiOk } from "@/lib/api-response";
import { isSameOrigin } from "@/lib/same-origin";
import { getSession } from "@/lib/session";
import { categoryExists } from "@/services/categories-service";
import { notifyTransactionsDeleted } from "@/services/notification-events";
import { notifyTransactionSaved } from "@/services/notifications-service";
import {
  deleteTransactions,
  getTransaction,
  updateTransaction,
} from "@/services/transactions-service";

const notFound = () => apiError(404, "not_found", "We couldn't find that transaction.");
const unauthenticated = () => apiError(401, "unauthenticated", "Please log in to continue.");

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/transactions/[id]">) {
  const session = await getSession();
  if (!session) return unauthenticated();
  const { id } = await ctx.params;
  const found = await getTransaction(session.id, id);
  return found ? apiOk(found, { source: "database" }) : notFound();
}

export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/transactions/[id]">) {
  if (!isSameOrigin(request)) return apiError(403, "forbidden", "Request blocked.");
  const session = await getSession();
  if (!session) return unauthenticated();

  const body = transactionInputSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return apiError(400, "invalid_body", body.error.issues[0]?.message ?? "Invalid transaction.");
  }
  if (!(await categoryExists(session.id, body.data.type, body.data.category))) {
    return apiError(400, "invalid_body", "Choose one of your categories.");
  }
  const { id } = await ctx.params;
  const updated = await updateTransaction(session.id, id, body.data);
  if (!updated) return notFound();
  await notifyTransactionSaved(
    session.id,
    { ...updated, amount: Math.abs(updated.amount), recurring: Boolean(updated.recurring) },
    new Date(),
    "updated",
  );
  return apiOk(updated, { source: "database" });
}

export async function DELETE(request: NextRequest, ctx: RouteContext<"/api/transactions/[id]">) {
  if (!isSameOrigin(request)) return apiError(403, "forbidden", "Request blocked.");
  const session = await getSession();
  if (!session) return unauthenticated();
  const { id } = await ctx.params;
  const existing = await getTransaction(session.id, id);
  if ((await deleteTransactions(session.id, [id])) === 0) return notFound();
  if (existing) await notifyTransactionsDeleted(session.id, [existing.title]);
  return apiOk({ id }, { source: "database" });
}
