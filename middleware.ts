import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const PUBLIC_PATHS = new Set(["/login", "/register"]);
const CUSTOMER_PATHS = new Set(["/", "/account", "/orders/history", "/cart", "/checkout", "/confirmation"]);
const CASHIER_ALLOWED = new Set(["/terminal", "/inventory"]);
const CASHIER_BLOCKED = new Set(["/admin", "/reports", "/dashboard", "/users"]);

const JWT_SECRET_RAW = process.env.JWT_SECRET || "fallback-secret";
const JWT_CUSTOMER_SECRET_RAW = process.env.JWT_CUSTOMER_SECRET || process.env.JWT_SECRET || "fallback-secret";
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_RAW);
const JWT_CUSTOMER_SECRET = new TextEncoder().encode(JWT_CUSTOMER_SECRET_RAW);

interface EmployeePayload {
  userId: string;
  role?: string;
  email?: string;
  storeId?: string;
}

interface CustomerPayload {
  id: string;
  email: string;
  role: "customer";
}

async function verifyEmployeeToken(token: string): Promise<EmployeePayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (typeof payload.userId !== "string") return null;
    return payload as unknown as EmployeePayload;
  } catch {
    return null;
  }
}

async function verifyCustomerToken(token: string): Promise<CustomerPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_CUSTOMER_SECRET);
    if (payload.role !== "customer" || typeof payload.id !== "string") return null;
    return payload as unknown as CustomerPayload;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/_next") || pathname.startsWith("/api") || pathname === "/favicon.ico") {
    return NextResponse.next();
  }

  const employeeToken = request.cookies.get("bt_auth")?.value;
  const customerToken = request.cookies.get("bt_customer_token")?.value;

  if (pathname === "/" && employeeToken) {
    const payload = await verifyEmployeeToken(employeeToken);
    if (payload) return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const isCustomerRoute = CUSTOMER_PATHS.has(pathname) ||
    pathname.startsWith("/account/") ||
    pathname.startsWith("/orders/history/");

  if (isCustomerRoute) {
    if (!customerToken) return NextResponse.redirect(new URL("/login", request.url));
    const valid = await verifyCustomerToken(customerToken);
    if (!valid) return NextResponse.redirect(new URL("/login", request.url));
    return NextResponse.next();
  }

  if (PUBLIC_PATHS.has(pathname)) return NextResponse.next();

  if (!employeeToken) return NextResponse.redirect(new URL("/login", request.url));
  const employee = await verifyEmployeeToken(employeeToken);
  if (!employee) return NextResponse.redirect(new URL("/login", request.url));

  const { role } = employee;
  if (role === "ADMIN") return NextResponse.next();
  if (role === "MANAGER") {
    if (pathname.startsWith("/admin/users")) return NextResponse.redirect(new URL("/dashboard", request.url));
    return NextResponse.next();
  }
  if (role === "CASHIER") {
    const isBlocked = CASHIER_BLOCKED.has(pathname) || [...CASHIER_BLOCKED].some(b => pathname.startsWith(b + "/"));
    if (isBlocked) return NextResponse.redirect(new URL("/terminal", request.url));
    const isAllowed = CASHIER_ALLOWED.has(pathname) || [...CASHIER_ALLOWED].some(a => pathname.startsWith(a + "/"));
    if (!isAllowed) return NextResponse.redirect(new URL("/terminal", request.url));
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = { matcher: ["/((?!api|_next|favicon.ico).*)"] };