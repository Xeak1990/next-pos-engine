import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { verifyAuthToken } from "../../../../lib/token-utils";
import { cookies } from "next/headers";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const token = cookieStore.get("bt_auth")?.value;
  const payload = token ? await verifyAuthToken(token) : null;
  if (!payload || payload.role !== "ADMIN") {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }
  const { id } = await context.params;
  const { name, location } = await request.json();
  const store = await prisma.store.update({
    where: { id },
    data: { name, location },
  });
  return NextResponse.json(store);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const token = cookieStore.get("bt_auth")?.value;
  const payload = token ? await verifyAuthToken(token) : null;
  if (!payload || payload.role !== "ADMIN") {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }
  const { id } = await context.params;
  await prisma.store.delete({ where: { id } });
  return NextResponse.json({ success: true });
}