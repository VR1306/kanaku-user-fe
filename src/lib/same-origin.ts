import { APP_URL } from "@/constants/urls";

/**
 * CSRF guard for state-changing route handlers: browsers always send `Origin` on cross-site
 * writes, so a mismatch means the request didn't come from this site or from the frontend
 * (NEXT_APP_URL) when the API is hosted separately. (No Origin = not a browser.)
 */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    const url = new URL(origin);
    if (url.host === request.headers.get("host")) return true;
    return APP_URL !== "" && url.origin === new URL(APP_URL).origin;
  } catch {
    return false;
  }
}
