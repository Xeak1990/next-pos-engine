import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { signAuthToken } from "../../../../lib/token-utils";
import { verifyPassword } from "../../../../lib/auth-utils";
import { generateCustomerToken } from "../../../../lib/customer-auth-utils";

export async function POST(request: NextRequest) {
  console.log("[login] ====== Nueva solicitud de login ======");
  try {
    const { email, password, rememberMe } = await request.json();
    console.log(`[login] Email: ${email}, rememberMe: ${rememberMe}`);

    if (!email || !password) {
      console.log("[login] Faltan email o password");
      return NextResponse.json(
        { error: "Correo y contraseña son obligatorios" },
        { status: 400 },
      );
    }

    // 1. Buscar empleado
    console.log("[login] Buscando empleado con email:", email);
    const user = await prisma.user.findUnique({
      where: { email },
      include: { store: true },
    });

    if (user) {
      console.log("[login] Empleado encontrado, verificando contraseña...");
      const valid = await verifyPassword(password, user.password);
      if (!valid || !user.isActive) {
        console.log("[login] Contraseña inválida o usuario inactivo");
        return NextResponse.json(
          { error: "Credenciales inválidas" },
          { status: 401 },
        );
      }
      console.log("[login] Empleado autenticado, generando token...");
      const token = await signAuthToken({
        userId: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        storeId: user.storeId ?? null,
        storeName: user.store?.name ?? null,
        storeLocation: user.store?.location ?? null,
      });
      console.log(`[login] Token generado (primeros 20): ${token.substring(0, 20)}...`);
      const response = NextResponse.json({
        ok: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        redirectTo: user.role === "CASHIER" ? "/terminal" : "/dashboard",
      });
      response.cookies.set("bt_auth", token, {
        httpOnly: true,
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 8,
        domain: process.env.NODE_ENV === "production" ? process.env.VERCEL_URL || undefined : undefined,
      });
      console.log("[login] Cookie bt_auth establecida, respuesta enviada");
      return response;
    }

    // 2. Buscar cliente
    console.log("[login] No es empleado, buscando cliente...");
    const customer = await prisma.customer.findUnique({ where: { email } });
    if (customer) {
      console.log("[login] Cliente encontrado, verificando contraseña...");
      const valid = await verifyPassword(password, customer.password);
      if (!valid) {
        console.log("[login] Contraseña de cliente inválida");
        return NextResponse.json(
          { error: "Credenciales inválidas" },
          { status: 401 },
        );
      }
      console.log("[login] Cliente autenticado, generando token...");
      const token = await generateCustomerToken(customer.id, customer.email);
      console.log(`[login] Token generado (primeros 20): ${token.substring(0, 20)}...`);
      const response = NextResponse.json({
        ok: true,
        user: { role: "CUSTOMER", name: customer.name, email: customer.email },
        redirectTo: "/",
      });
      response.cookies.set("bt_customer_token", token, {
        httpOnly: true,
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: rememberMe ? 60 * 60 * 24 * 7 : undefined,
        domain: process.env.NODE_ENV === "production" ? process.env.VERCEL_URL || undefined : undefined,
      });
      console.log("[login] Cookie bt_customer_token establecida, respuesta enviada");
      return response;
    }

    console.log("[login] No se encontró ni empleado ni cliente con ese email");
    return NextResponse.json(
      { error: "Credenciales inválidas" },
      { status: 401 },
    );
  } catch (error) {
    console.error("[login] Error inesperado:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}