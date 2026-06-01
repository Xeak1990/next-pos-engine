// middleware.ts
import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const PUBLIC_PATHS = new Set(["/login", "/catalog"]);
const CUSTOMER_PATHS = new Set(["/account", "/orders/history"]);
const CASHIER_ALLOWED = new Set(["/terminal", "/inventory"]);
const CASHIER_BLOCKED = new Set(["/admin", "/reports", "/dashboard", "/users"]);
const CUSTOMER_PREFIXES = ["/account/", "/orders/history/"];

// Obtener secretos con logs
const JWT_SECRET_RAW = process.env.JWT_SECRET || "fallback-secret-change-me";
const JWT_CUSTOMER_SECRET_RAW = process.env.JWT_CUSTOMER_SECRET || process.env.JWT_SECRET || "fallback-secret-change-me";

console.log(`[middleware] JWT_SECRET definido: ${!!process.env.JWT_SECRET}`);
console.log(`[middleware] JWT_CUSTOMER_SECRET definido: ${!!process.env.JWT_CUSTOMER_SECRET}`);

const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_RAW);
const JWT_CUSTOMER_SECRET = new TextEncoder().encode(JWT_CUSTOMER_SECRET_RAW);

interface AuthPayload {
  userId: string;
  role?: string;
  email?: string;
  storeId?: string;
}

async function verifyToken(token: string, secret: Uint8Array, type: "employee" | "customer"): Promise<AuthPayload | null> {
  try {
    console.log(`[verifyToken] Verificando token ${type} (primeros 20): ${token.substring(0, 20)}...`);
    const { payload } = await jwtVerify(token, secret);
    if (typeof payload.userId !== "string") {
      console.warn(`[verifyToken] Payload de ${type} sin userId`);
      return null;
    }
    console.log(`[verifyToken] Token ${type} válido, userId: ${payload.userId}`);
    return payload as unknown as AuthPayload;
  } catch (err) {
    console.error(`[verifyToken] Error verificando token ${type}:`, err);
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  console.log(`[middleware] ====== Iniciando procesamiento de ruta: ${pathname} ======`);

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico"
  ) {
    console.log("[middleware] Ruta excluida (asset o API) -> NextResponse.next()");
    return NextResponse.next();
  }

  if (PUBLIC_PATHS.has(pathname) || pathname === "/") {
    console.log("[middleware] Ruta pública, permitiendo acceso");
    return NextResponse.next();
  }

  const isCustomerPath =
    CUSTOMER_PATHS.has(pathname) ||
    CUSTOMER_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (isCustomerPath) {
    console.log("[middleware] Ruta protegida para clientes:", pathname);
    const customerToken = request.cookies.get("bt_customer_token")?.value;
    console.log(`[middleware] Cookie bt_customer_token existe: ${!!customerToken}`);
    if (customerToken) {
      console.log(`[middleware] Valor cookie (primeros 20): ${customerToken.substring(0, 20)}...`);
    } else {
      console.log("[middleware] No se encontró cookie de cliente");
    }

    if (!customerToken) {
      console.log("[middleware] Redirigiendo a /login porque falta cookie");
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const customerPayload = await verifyToken(customerToken, JWT_CUSTOMER_SECRET, "customer");
    if (!customerPayload) {
      console.log("[middleware] Token de cliente inválido, eliminando cookie y redirigiendo");
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("bt_customer_token");
      return response;
    }
    console.log("[middleware] Cliente autenticado, acceso permitido");
    return NextResponse.next();
  }

  // Resto del middleware para empleados (igual)
  const token = request.cookies.get("bt_auth")?.value;
  console.log(`[middleware] Cookie bt_auth existe: ${!!token}`);
  if (!token) {
    console.log("[middleware] No hay cookie de empleado, redirigiendo a /login");
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const payload = await verifyToken(token, JWT_SECRET, "employee");
  if (!payload) {
    console.log("[middleware] Token de empleado inválido, eliminando cookie y redirigiendo");
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("bt_auth");
    return response;
  }

  const { role } = payload;
  console.log(`[middleware] Usuario autenticado con rol: ${role}`);

  if (role === "ADMIN") {
    console.log("[middleware] ADMIN: acceso total");
    return NextResponse.next();
  }

  if (role === "MANAGER") {
    if (pathname.startsWith("/admin/users")) {
      console.log("[middleware] MANAGER bloqueado en /admin/users, redirigiendo a /dashboard");
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    console.log("[middleware] MANAGER: acceso permitido");
    return NextResponse.next();
  }

  if (role === "CASHIER") {
    if (CASHIER_BLOCKED.has(pathname) || [...CASHIER_BLOCKED].some(b => pathname.startsWith(b + "/"))) {
      console.log("[middleware] CASHIER: ruta bloqueada, redirigiendo a /terminal");
      return NextResponse.redirect(new URL("/terminal", request.url));
    }
    const isAllowed = CASHIER_ALLOWED.has(pathname) ||
      [...CASHIER_ALLOWED].some(allowed => pathname.startsWith(allowed + "/"));
    if (!isAllowed) {
      console.log("[middleware] CASHIER: ruta no permitida, redirigiendo a /terminal");
      return NextResponse.redirect(new URL("/terminal", request.url));
    }
    console.log("[middleware] CASHIER: acceso permitido");
    return NextResponse.next();
  }

  console.log("[middleware] Rol no reconocido, redirigiendo a /login");
  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: ["/((?!api|_next|favicon.ico).*)"],
};