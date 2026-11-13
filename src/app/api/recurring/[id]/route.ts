import { moduleBlocked } from "@/lib/module-guard";
import type { NextRequest } from "next/server";
import { recurringInputSchema, recurringPatchSchema } from "@/features/recurring/schemas";
import { apiError, apiOk } from "@/lib/api-response";
import { isSameOrigin } from "@/lib/same-origin";
import { getSession } from "@/lib/session";
import { categoryExists } from "@/services/categories-service";
import { notifyRecurring } from "@/services/notification-events";
import { runDueRecurring } from "@/services/recurring-runner";
import {
  deleteRecurring,
  listRecurring,
  setRecurringActive,
  updateRecurring,
} from "@/services/recurring-service";

const unauthenticated = () => apiError(401, "unauthenticated", "Please log in to continue.");
const notFound = () => apiError(404, "not_found", "We couldn't find that recurring payment.");

/** PUT /api/recurring/:id : replace the schedule's details. */
export async function PUT(request: NextRequest, ctx: RouteContext<"/api/recurring/[id]">) {
  if (!isSameOrigin(request)) return apiError(403, "forbidden", "Request blocked.");
  const session = await getSession();
  if (!session) return unauthenticated();
  const blocked = await moduleBlocked(session.id, "recurring");
  if (blocked) return blocked;

  const body = recurringInputSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return apiError(400, "invalid_body", body.error.issues[0]?.message ?? "Invalid payment.");
  }
  if (body.data.nextDue < new Date().toISOString().slice(0, 10)) {
    return apiError(400, "invalid_body", "The next payment can't be in the past.");
  }
  if (!(await categoryExists(session.id, body.data.type, body.data.category))) {
    return apiError(400, "invalid_body", "Choose one of your categories.");
  }
  const { id } = await ctx.params;
  if (!(await updateRecurring(session.id, id, body.data))) return notFound();
  await notifyRecurring(session.id, {
    title: body.data.title,
    action: "updated",
    amount: body.data.amount,
    frequency: body.data.frequency,
    nextDue: body.data.nextDue,
  });
  await runDueRecurring(session.id);
  return apiOk({ id }, { source: "database" });
}

/** PATCH /api/recurring/:id  body: { active } : pause or resume. */
export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/recurring/[id]">) {
  if (!isSameOrigin(request)) return apiError(403, "forbidden", "Request blocked.");
  const session = await getSession();
  if (!session) return unauthenticated();
  const blocked = await moduleBlocked(session.id, "recurring");
  if (blocked) return blocked;

  const body = recurringPatchSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return apiError(400, "invalid_body", "Say whether it should be active.");
  const { id } = await ctx.params;
  const before = (await listRecurring(session.id)).items.find((i) => i.id === id);
  if (!(await setRecurringActive(session.id, id, body.data.active))) return notFound();
  if (before && before.active !== body.data.active) {
    await notifyRecurring(session.id, {
      title: before.title,
      action: body.data.active ? "resumed" : "paused",
    });
  }
  if (body.data.active) await runDueRecurring(session.id);
  return apiOk({ id }, { source: "database" });
}

export async function DELETE(request: NextRequest, ctx: RouteContext<"/api/recurring/[id]">) {
  if (!isSameOrigin(request)) return apiError(403, "forbidden", "Request blocked.");
  const session = await getSession();
  if (!session) return unauthenticated();
  const blocked = await moduleBlocked(session.id, "recurring");
  if (blocked) return blocked;
  const { id } = await ctx.params;
  const before = (await listRecurring(session.id)).items.find((i) => i.id === id);
  if (!(await deleteRecurring(session.id, id))) return notFound();
  if (before) await notifyRecurring(session.id, { title: before.title, action: "deleted" });
  return apiOk({ id }, { source: "database" });
}
