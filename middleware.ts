import { NextResponse, type NextRequest } from "next/server";
import { verifyAuthToken } from "./src/lib/token-utils";

const adminPaths = ["/users", "/admin/users"];
const managerPaths = ["/reports"];
const authenticatedPaths = ["/terminal", "/reports", "/users", "/admin/users"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/_next") || pathname.startsWith("/api") || pathname.startsWith("/favicon.ico")) {
    return NextResponse.next();
  }

  if (pathname === "/Login" || pathname === "/" || pathname === "/login") {
    return NextResponse.next();
  }

  if (!authenticatedPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    return NextResponse.next();
  }

  const token = request.cookies.get("bt_auth")?.value;
  const authPayload = token ? await verifyAuthToken(token) : null;
  if (!authPayload) {
    return NextResponse.redirect(new URL("/Login", request.url));
  }

  if (adminPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    if (authPayload.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/Login", request.url));
    }
  }

  if (managerPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    if (!["ADMIN", "MANAGER"].includes(authPayload.role)) {
      return NextResponse.redirect(new URL("/Login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/terminal/:path*", "/reports/:path*", "/users/:path*", "/admin/users/:path*"],
};
