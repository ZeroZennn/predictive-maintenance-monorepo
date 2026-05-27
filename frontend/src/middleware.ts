import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Inlined to avoid heavy @/config and @/types import chains in the Edge Runtime.
 * Next.js middleware runs on the Edge Runtime (not Node.js), so only lightweight,
 * self-contained modules are safe to import here.
 */
type UserRole = "TECHNICIAN" | "ADMIN";

const PUBLIC_ROUTES = ["/", "/login"] as const;
const ADMIN_ONLY_ROUTES = ["/admin"] as const;
const DASHBOARD = "/dashboard";
const LOGIN = "/login";

// =============================================================================
// Helper — decode JWT payload segment safely.
// atob() requires standard base64, but JWTs use base64url (- and _ instead of
// + and /), and omit padding. This function handles both conversions.
// =============================================================================

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    // Konversi base64url → base64 standar
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");

    // Padding agar panjang kelipatan 4
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "="
    );

    const decoded = atob(padded);
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export default function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("lapis_token")?.value ?? null;

  // ============================================================
  // DEV BYPASS / MOCK ROLE — Hanya aktif jika NEXT_PUBLIC_SKIP_AUTH=true
  // WAJIB dihapus atau di-set false sebelum production build
  // ============================================================
  if (process.env.NEXT_PUBLIC_SKIP_AUTH === "true") {
    const mockRole = process.env.NEXT_PUBLIC_MOCK_ROLE;
    if (mockRole) {
      const isAdminRoute = ADMIN_ONLY_ROUTES.some((route) =>
        pathname.startsWith(route)
      );
      if (isAdminRoute && mockRole !== "ADMIN") {
        return NextResponse.redirect(new URL(DASHBOARD, request.url));
      }
    }
    return NextResponse.next();
  }

  /**
   * STEP 1 — Public route check.
   * Authenticated users with a valid token are bounced to the dashboard.
   * If token is present but malformed, we let the user through to /login
   * (avoids an infinite redirect loop).
   * Unauthenticated users may proceed to public routes freely.
   */
  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname === route);
  if (isPublicRoute) {
    if (token) {
      const payload = decodeJwtPayload(token);
      if (payload && typeof payload.role === "string") {
        const userRole = payload.role.toUpperCase();
        const targetUrl = userRole === "ADMIN" ? "/admin" : DASHBOARD;
        return NextResponse.redirect(new URL(targetUrl, request.url));
      }
    }
    return NextResponse.next();
  }

  if (!token) {
    return NextResponse.redirect(new URL(LOGIN, request.url));
  }

  const payload = decodeJwtPayload(token);

  if (!payload || typeof payload.role !== "string") {
    const response = NextResponse.redirect(new URL(LOGIN, request.url));
    response.cookies.delete("lapis_token");
    return response;
  }

  const role = payload.role.toUpperCase() as UserRole;

  const isAdminRoute = ADMIN_ONLY_ROUTES.some((route) =>
    pathname.startsWith(route)
  );
  if (isAdminRoute && role !== "ADMIN") {
    return NextResponse.redirect(new URL(DASHBOARD, request.url));
  }

  const isDashboardRoute = pathname.startsWith(DASHBOARD);
  if (isDashboardRoute && role === "ADMIN") {
    return NextResponse.redirect(new URL("/admin", request.url));
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
