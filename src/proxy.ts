import { PROTECTED_ROUTES, ROUTES } from "@/constants/routes";
import { SESSION_COOKIE_NAME } from "@/constants/auth";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Optimistic gate: bounces requests with no session cookie to /login.
 * The cookie signature itself is verified server-side in the (app) layout.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isProtected = PROTECTED_ROUTES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (isProtected && !request.cookies.has(SESSION_COOKIE_NAME)) {
    const url = new URL(ROUTES.login, request.url);
    url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"] };
