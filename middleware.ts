// middleware.ts
import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

// ============================================================
// Configuración de rutas
// ============================================================

// Rutas públicas (sin autenticación)
const PUBLIC_PATHS = new Set(["/login", "/catalog"]);

// Rutas protegidas solo para clientes (no empleados)
const CUSTOMER_PATHS = new Set(["/account", "/orders/history"]);

// Rutas permitidas para cajeros (solo estas, el resto no)
const CASHIER_ALLOWED = new Set(["/terminal", "/inventory"]);

// Rutas prohibidas para cajeros (aunque estén en la whitelist)
const CASHIER_BLOCKED = new Set(["/admin", "/reports", "/dashboard", "/users"]);

// Prefijos para rutas dinámicas de clientes (ej. /account/123, /orders/history/456)
const CUSTOMER_PREFIXES = ["/account/", "/orders/history/"];

// ============================================================
// Helper: verificar token JWT (compatible con Edge Runtime)
// ============================================================
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-change-me"
);
const JWT_CUSTOMER_SECRET = new TextEncoder().encode(
  process.env.JWT_CUSTOMER_SECRET || process.env.JWT_SECRET || "fallback-secret-change-me"
);

interface AuthPayload {
  userId: string;
  role?: string;
  email?: string;
  storeId?: string;
}

async function verifyToken(token: string, secret: Uint8Array): Promise<AuthPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    // Verificar que el payload tenga userId (campo obligatorio)
    if (typeof payload.userId !== "string") {
      return null;
    }
    // Type assertion doble para evitar conflicto con JWTPayload
    return payload as unknown as AuthPayload;
  } catch {
    return null;
  }
}

// ============================================================
// Middleware principal
// ============================================================
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Excluir assets estáticos y API
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // 2. Rutas públicas
  if (PUBLIC_PATHS.has(pathname) || pathname === "/") {
    return NextResponse.next();
  }

  // 3. Rutas de clientes (requieren token de cliente)
  const isCustomerPath =
    CUSTOMER_PATHS.has(pathname) ||
    CUSTOMER_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (isCustomerPath) {
    const customerToken = request.cookies.get("bt_customer_token")?.value;
    if (!customerToken) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    const customerPayload = await verifyToken(customerToken, JWT_CUSTOMER_SECRET);
    if (!customerPayload) {
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("bt_customer_token");
      return response;
    }
    return NextResponse.next();
  }

  // 4. Rutas de empleados (requieren token bt_auth)
  const token = request.cookies.get("bt_auth")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const payload = await verifyToken(token, JWT_SECRET);
  if (!payload) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("bt_auth");
    return response;
  }

  const { role } = payload;

  // 5. Acceso por rol
  if (role === "ADMIN") {
    return NextResponse.next();
  }

  if (role === "MANAGER") {
    // Bloquear solo /admin/users
    if (pathname.startsWith("/admin/users")) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  if (role === "CASHIER") {
    // Bloqueo prioritario
    if (CASHIER_BLOCKED.has(pathname) || [...CASHIER_BLOCKED].some(b => pathname.startsWith(b + "/"))) {
      return NextResponse.redirect(new URL("/terminal", request.url));
    }
    // Permitir solo rutas en la whitelist (incluyendo subrutas)
    const isAllowed = CASHIER_ALLOWED.has(pathname) ||
      [...CASHIER_ALLOWED].some(allowed => pathname.startsWith(allowed + "/"));
    if (!isAllowed) {
      return NextResponse.redirect(new URL("/terminal", request.url));
    }
    return NextResponse.next();
  }

  // Si el rol no es reconocido, redirigir al login
  return NextResponse.redirect(new URL("/login", request.url));
}

// ============================================================
// Configuración del matcher
// ============================================================
export const config = {
  matcher: ["/((?!api|_next|favicon.ico).*)"],
};