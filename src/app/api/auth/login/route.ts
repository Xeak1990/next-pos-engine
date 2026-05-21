import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { signAuthToken } from "../../../../lib/token-utils";
import { verifyPassword } from "../../../../lib/auth-utils";
import { generateCustomerToken } from "../../../../lib/customer-auth-utils"; // nueva importación

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Correo y contraseña son obligatorios" }, { status: 400 });
    }

    // 1. Buscar en usuarios empleados (User)
    const user = await prisma.user.findUnique({
      where: { email },
      include: { store: true },
    });

    let isCustomer = false;

    if (!user) {
      // 2. Buscar en clientes (Customer)
      const customer = await prisma.customer.findUnique({ where: { email } });
      if (customer) {
        const valid = await verifyPassword(password, customer.password);
        if (valid && customer) {
          // Autenticación exitosa como cliente
          isCustomer = true;
          const token = generateCustomerToken(customer.id, customer.email);
          const response = NextResponse.json({
            ok: true,
            user: { role: "CUSTOMER", name: customer.name, email: customer.email },
            redirectTo: "/",
          });
          response.cookies.set({
            name: "bt_customer_token",
            value: token,
            httpOnly: true,
            path: "/",
            sameSite: "strict",
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60 * 24 * 7, // 7 días
          });
          return response;
        }
      }
      // No se encontró ni empleado ni cliente válido
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
    }

    // Empleado encontrado, validar contraseña y estado
    const passwordMatches = await verifyPassword(password, user.password);
    if (!passwordMatches || !user.isActive) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
    }

    // Generar token para empleado
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
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        storeId: user.storeId ?? null,
        storeName: user.store?.name ?? null,
        storeLocation: user.store?.location ?? null,
      },
      redirectTo: user.role === "CASHIER" ? "/terminal" : "/dashboard",
    });

    response.cookies.set({
      name: "bt_auth",
      value: token,
      httpOnly: true,
      path: "/",
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 8,
    });

    return response;
  } catch (error) {
    console.error("Error en login:", error);
    return NextResponse.json({ error: "No se pudo iniciar sesión" }, { status: 500 });
  }
}