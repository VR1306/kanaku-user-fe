/**
 * CSRF guard for state-changing route handlers: browsers always send `Origin` on cross-site
 * writes, so a mismatch means the request didn't come from this site. (No Origin = not a browser.)
 */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === request.headers.get("host");
  } catch {
    return false;
  }
}
