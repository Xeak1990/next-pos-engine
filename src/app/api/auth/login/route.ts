// app/api/auth/login/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { signAuthToken } from "../../../../lib/token-utils";
import { verifyPassword } from "../../../../lib/auth-utils";
import { generateCustomerToken } from "../../../../lib/customer-auth-utils";

export async function POST(request: NextRequest) {
  try {
    const { email, password, rememberMe } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Correo y contraseña son obligatorios" }, { status: 400 });
    }

    // 1. Buscar empleado
    const user = await prisma.user.findUnique({
      where: { email },
      include: { store: true },
    });

    if (user) {
      const valid = await verifyPassword(password, user.password);
      if (!valid || !user.isActive) {
        return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
      }
      const token = await signAuthToken({
        userId: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        storeId: user.storeId ?? null,
        storeName: user.store?.name ?? null,
        storeLocation: user.store?.location ?? null,
      });
      const response = NextResponse.json({
        ok: true,
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        redirectTo: user.role === "CASHIER" ? "/terminal" : "/dashboard",
      });
      response.cookies.set("bt_auth", token, {
        httpOnly: true,
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 8,
      });
      return response;
    }

    // 2. Buscar cliente
    const customer = await prisma.customer.findUnique({ where: { email } });
    if (customer) {
      const valid = await verifyPassword(password, customer.password);
      if (!valid) {
        return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
      }
      const token = await generateCustomerToken(customer.id, customer.email);
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
      });
      return response;
    }

    return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}