import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const LANDING_APP_URL =
  process.env.NEXT_PUBLIC_LANDING_URL || "{{LANDING_URL}}";
const SESSION_COOKIE_NAME = "session_id";

function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL("/login", LANDING_APP_URL);
  const returnUrl = `${request.nextUrl.origin}${request.nextUrl.pathname}${request.nextUrl.search}`;
  loginUrl.searchParams.set("redirect", returnUrl);
  return NextResponse.redirect(loginUrl);
}

/**
 * Optimistic network gate — checks for a session cookie only.
 * Real auth validation happens in requireAuth() and API route handlers.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionId = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionId) {
    return redirectToLogin(request);
  }

  if (pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*|api/auth).*)"],
};
