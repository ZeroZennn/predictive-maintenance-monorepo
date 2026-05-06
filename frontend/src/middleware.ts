import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Inlined to avoid heavy @/config and @/types import chains in the Edge Runtime.
 * Next.js middleware runs on the Edge Runtime (not Node.js), so only lightweight,
 * self-contained modules are safe to import here.
 */
type UserRole = "TECHNICIAN" | "ADMIN";

const PUBLIC_ROUTES = ["/login"] as const;
const ADMIN_ONLY_ROUTES = ["/admin"] as const;
const DASHBOARD = "/";
const LOGIN = "/login";

export default function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("lapis_token")?.value ?? null;

  /**
   * STEP 1 — Public route check.
   * Authenticated users are bounced away from /login to the dashboard.
   * Unauthenticated users may proceed to public routes freely.
   */
  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname === route);
  if (isPublicRoute) {
    if (token) {
      return NextResponse.redirect(new URL(DASHBOARD, request.url));
    }
    return NextResponse.next();
  }

  /**
   * STEP 2 — Token presence check.
   * Every non-public route requires the lapis_token session cookie.
   * Missing token → redirect to login.
   */
  if (!token) {
    return NextResponse.redirect(new URL(LOGIN, request.url));
  }

  /**
   * STEP 3 — Decode JWT payload (manual, no external library).
   * JWT structure: header.payload.signature
   * The payload is base64url-encoded JSON — decode with atob() after
   * replacing URL-safe characters back to standard base64.
   * Malformed or missing token → redirect to login.
   */
  let role: UserRole | null = null;
  try {
    const payloadBase64 = token.split(".")[1];
    if (!payloadBase64) throw new Error("Missing JWT payload segment");

    // base64url → base64 (replace URL-safe chars with standard base64 chars)
    const base64 = payloadBase64.replace(/-/g, "+").replace(/_/g, "/");
    const jsonString = atob(base64);
    const parsed: unknown = JSON.parse(jsonString);

    // Type narrowing — ensure parsed is an object with a valid string "role" field
    if (
      parsed !== null &&
      typeof parsed === "object" &&
      "role" in parsed &&
      typeof (parsed as Record<string, unknown>).role === "string"
    ) {
      role = (parsed as Record<string, unknown>).role as UserRole;
    } else {
      throw new Error("JWT payload missing 'role' field");
    }
  } catch {
    return NextResponse.redirect(new URL(LOGIN, request.url));
  }

  /**
   * STEP 4 — Admin-only route enforcement.
   * Routes under /admin are restricted to users with role "ADMIN".
   * Any other authenticated role is redirected to the dashboard.
   */
  const isAdminRoute = ADMIN_ONLY_ROUTES.some((route) =>
    pathname.startsWith(route)
  );
  if (isAdminRoute && role !== "ADMIN") {
    return NextResponse.redirect(new URL(DASHBOARD, request.url));
  }

  /**
   * STEP 5 — All validations passed.
   * Allow the request to continue to the requested page.
   */
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|ico)$).*)",
  ],
};
