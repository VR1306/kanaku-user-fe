import { moduleBlocked } from "@/lib/module-guard";
import type { NextRequest } from "next/server";
import { recurringInputSchema } from "@/features/recurring/schemas";
import { apiError, apiOk } from "@/lib/api-response";
import { isSameOrigin } from "@/lib/same-origin";
import { getSession } from "@/lib/session";
import { categoryExists } from "@/services/categories-service";
import { notifyRecurring } from "@/services/notification-events";
import { createRecurring, listRecurring } from "@/services/recurring-service";
import { runDueRecurring } from "@/services/recurring-runner";

const unauthenticated = () => apiError(401, "unauthenticated", "Please log in to continue.");

/** GET /api/recurring : every schedule plus the monthly totals. */
export async function GET() {
  const session = await getSession();
  if (!session) return unauthenticated();
  const blocked = await moduleBlocked(session.id, "recurring");
  if (blocked) return blocked;
  await runDueRecurring(session.id);
  return apiOk(await listRecurring(session.id), { source: "database" });
}

/** POST /api/recurring : create a schedule. Starting today logs the first payment straight away. */
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return apiError(403, "forbidden", "Request blocked.");
  const session = await getSession();
  if (!session) return unauthenticated();
  const blocked = await moduleBlocked(session.id, "recurring");
  if (blocked) return blocked;

  const body = recurringInputSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return apiError(400, "invalid_body", body.error.issues[0]?.message ?? "Invalid payment.");
  }
  const today = new Date().toISOString().slice(0, 10);
  if (body.data.nextDue < today) {
    return apiError(400, "invalid_body", "The first payment can't be in the past.");
  }
  if (!(await categoryExists(session.id, body.data.type, body.data.category))) {
    return apiError(400, "invalid_body", "Choose one of your categories.");
  }
  const id = await createRecurring(session.id, body.data);
  await notifyRecurring(session.id, {
    title: body.data.title,
    action: "added",
    amount: body.data.amount,
    frequency: body.data.frequency,
    nextDue: body.data.nextDue,
  });
  await runDueRecurring(session.id);
  return apiOk({ id }, { source: "database" }, 201);
}
