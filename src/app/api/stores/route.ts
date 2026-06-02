import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { verifyAuthToken } from "../../../lib/token-utils";
import { verifyCustomerToken } from "../../../lib/customer-auth-utils";
import { cookies } from "next/headers";

// GET: permite ADMIN o clientes autenticados (para mostrar tiendas en el carrito)
export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("bt_auth")?.value;
  const customerToken = cookieStore.get("bt_customer_token")?.value;

  let isAdmin = false;
  let isCustomer = false;

  if (token) {
    const payload = await verifyAuthToken(token);
    if (payload && payload.role?.toUpperCase() === "ADMIN") {
      isAdmin = true;
    }
  }

  if (!isAdmin && customerToken) {
    const customer = await verifyCustomerToken(customerToken);
    if (customer) {
      isCustomer = true;
    }
  }

  if (!isAdmin && !isCustomer) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }

  // Si es ADMIN, devuelve datos completos (con conteos); si es cliente, solo campos públicos
  const stores = await prisma.store.findMany({
    select: isAdmin
      ? undefined // undefined significa todos los campos (comportamiento por defecto)
      : { id: true, name: true, location: true },
    ...(isAdmin
      ? { include: { _count: { select: { inventory: true, users: true } } } }
      : {}),
  });
  return NextResponse.json(stores);
}

// POST (solo ADMIN, sin cambios)
export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("bt_auth")?.value;
  const payload = token ? await verifyAuthToken(token) : null;
  if (!payload || payload.role !== "ADMIN") {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }
  const { name, location } = await request.json();
  if (!name || !location) {
    return NextResponse.json(
      { error: "Nombre y ubicación requeridos" },
      { status: 400 },
    );
  }
  const store = await prisma.store.create({
    data: { name, location },
  });
  return NextResponse.json(store, { status: 201 });
}