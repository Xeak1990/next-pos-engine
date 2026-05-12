import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { signAuthToken } from "../../../../lib/token-utils";
import { verifyPassword } from "../../../../lib/auth-utils";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Correo y contraseña son obligatorios" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        store: true,
      },
    });

    if (!user) {
      console.log("User not found for email:", email);
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
    }

    const passwordMatches = await verifyPassword(password, user.password);
    if (!passwordMatches || !user.isActive) {
      console.log("Password mismatch or user inactive for email:", email);
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
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        storeId: user.storeId ?? null,
        storeName: user.store?.name ?? null,
        storeLocation: user.store?.location ?? null,
      },
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
