import { apiError, apiOk } from "@/lib/api-response";
import { getSession } from "@/lib/session";
import { encode } from "@/lib/token";

/** How long a realtime token is valid. The browser asks for a fresh one on every (re)connect. */
const TOKEN_TTL_SEC = 60;

/**
 * GET /api/realtime/token : a short-lived signed token that lets the browser open its Socket.IO
 * connection. The realtime server can live on a different domain than the website (so it never
 * sees the website's cookie); this token is how it knows who is connecting.
 */
export async function GET() {
  const session = await getSession();
  if (!session) return apiError(401, "unauthenticated", "Please log in to continue.");
  const token = encode({ id: session.id, sid: session.sid, scope: "realtime" }, TOKEN_TTL_SEC);
  return apiOk({ token }, { source: "database" });
}
