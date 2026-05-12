import { NextResponse, type NextRequest } from "next/server";
import { verifyAuthToken } from "./src/lib/token-utils";

const publicPaths = ["/login", "/catalog"];
const cashierAllowedPaths = ["/terminal", "/inventory"];
const cashierBlockedPaths = ["/admin", "/reports", "/dashboard", "/users"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static assets and API routes
  if (pathname.startsWith("/_next") || pathname.startsWith("/api") || pathname.startsWith("/favicon.ico")) {
    return NextResponse.next();
  }

  // Check if the path is public
  const isPublicPath = publicPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  if (isPublicPath) {
    return NextResponse.next();
  }

  // For all other paths, require authentication
  const token = request.cookies.get("bt_auth")?.value;
  const authPayload = token ? await verifyAuthToken(token) : null;

  if (!authPayload) {
    // No session, redirect to login
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { role } = authPayload;

  // Admin has full access
  if (role === "ADMIN") {
    return NextResponse.next();
  }

  // Manager has access except to /admin/users
  if (role === "MANAGER") {
    if (pathname.startsWith("/admin/users")) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // Cashier restrictions
  if (role === "CASHIER") {
    // Check if trying to access blocked paths
    const isBlocked = cashierBlockedPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
    if (isBlocked) {
      return NextResponse.redirect(new URL("/terminal", request.url));
    }

    // Check if allowed
    const isAllowed = cashierAllowedPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
    if (!isAllowed) {
      // If not allowed, redirect to terminal
      return NextResponse.redirect(new URL("/terminal", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next|favicon.ico).*)"],
};
