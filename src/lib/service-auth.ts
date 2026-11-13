import "server-only";
import { timingSafeEqual } from "node:crypto";

/** Server-to-server calls from the Admin Portal: `Authorization: Bearer <SERVICE_API_KEY>` (≥ 16 chars). */
export function serviceAuthorised(request: Request): boolean {
  const key = process.env.SERVICE_API_KEY;
  const given = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!key || key.length < 16) return false;
  const a = Buffer.from(key);
  const b = Buffer.from(given);
  return a.length === b.length && timingSafeEqual(a, b);
}
