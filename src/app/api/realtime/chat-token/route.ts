import { apiError, apiOk } from "@/lib/api-response";
import { mintChatToken } from "@/lib/chat-token";
import { getSession } from "@/lib/session";

/** GET /api/realtime/chat-token : token for the support-chat socket (the signed-in user only). */
export async function GET() {
  const session = await getSession();
  if (!session) return apiError(401, "unauthenticated", "Please log in to continue.");
  try {
    return apiOk({ token: mintChatToken(session.id) }, { source: "database" });
  } catch {
    return apiError(503, "unavailable", "Live chat isn't configured.");
  }
}
