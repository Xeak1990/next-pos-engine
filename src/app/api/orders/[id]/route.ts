import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { verifyAuthToken } from "../../../../lib/token-utils";
import { cookies } from "next/headers";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }   // ← importante: params es Promesa
) {
  const { id } = await context.params;           // ← await aquí

  const cookieStore = await cookies();
  const token = cookieStore.get("bt_auth")?.value;
  if (!token) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const payload = await verifyAuthToken(token);
  if (!payload || (payload.role !== "ADMIN" && payload.role !== "MANAGER")) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }

  const { status } = await request.json();
  const allowed = ["pending", "paid", "shipped", "delivered", "cancelled"];
  if (!allowed.includes(status)) {
    return NextResponse.json({ error: "Estado no válido" }, { status: 400 });
  }

  const order = await prisma.order.update({
    where: { id },
    data: { status },
  });
  return NextResponse.json(order);
}