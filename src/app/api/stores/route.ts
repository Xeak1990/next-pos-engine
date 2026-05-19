import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { verifyAuthToken } from "../../../lib/token-utils";
import { cookies } from "next/headers";

// GET (solo ADMIN, pero devuelve todas las sucursales con conteos)
export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("bt_auth")?.value;
  const payload = token ? await verifyAuthToken(token) : null;
  if (!payload || payload.role !== "ADMIN") {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }
  const stores = await prisma.store.findMany({
    include: {
      _count: { select: { inventory: true, users: true } },
    },
  });
  return NextResponse.json(stores);
}

// POST (crear nueva sucursal)
export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("bt_auth")?.value;
  const payload = token ? await verifyAuthToken(token) : null;
  if (!payload || payload.role !== "ADMIN") {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }
  const { name, location } = await request.json();
  if (!name || !location) {
    return NextResponse.json({ error: "Nombre y ubicación requeridos" }, { status: 400 });
  }
  const store = await prisma.store.create({
    data: { name, location },
  });
  return NextResponse.json(store, { status: 201 });
}