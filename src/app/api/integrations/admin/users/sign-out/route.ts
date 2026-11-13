import { z } from "zod";
import { apiError, apiOk } from "@/lib/api-response";
import { serviceAuthorised } from "@/lib/service-auth";
import { revokeAllSessions } from "@/services/sessions-service";

/** POST /api/integrations/admin/users/sign-out { userId } : ends every session of that customer (service key only). */
export async function POST(request: Request) {
  if (!serviceAuthorised(request)) return apiError(401, "unauthenticated", "Invalid service key.");
  const parsed = z
    .object({ userId: z.string().min(1).max(80) })
    .safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError(400, "invalid_body", "Send { userId }.");
  await revokeAllSessions(parsed.data.userId);
  return apiOk({ signedOut: true }, { source: "database" });
}
