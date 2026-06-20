import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";

const LANDING_APP_URL =
  process.env.NEXT_PUBLIC_LANDING_URL || "{{LANDING_URL}}";
const MAIN_APP_URL =
  process.env.NEXT_PUBLIC_MAIN_APP_URL || "{{MAIN_APP_URL}}";

function buildLoginUrl(returnPath = "/dashboard") {
  const loginUrl = new URL("/login", LANDING_APP_URL);
  loginUrl.searchParams.set("redirect", `${MAIN_APP_URL}${returnPath}`);
  return loginUrl.toString();
}

/**
 * Server-side helper to require authentication
 * Use this in server components or server actions
 */
export async function requireAuth(returnPath = "/dashboard") {
  const user = await getCurrentUser();

  if (!user) {
    redirect(buildLoginUrl(returnPath));
  }

  return user;
}

/**
 * Server-side helper to get optional auth
 * Returns user if authenticated, null otherwise
 */
export async function getOptionalAuth() {
  return getCurrentUser();
}
