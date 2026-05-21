import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { verifyAuthToken } from "../../../lib/token-utils";
import { cookies } from "next/headers";

interface OrderItemInput {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  size?: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, total, customer, customerId } = body as {
      items: OrderItemInput[];
      total: number;
      customer: {
        customerName: string;
        customerEmail: string;
        customerPhone?: string;
        address: string;
        city: string;
        postalCode: string;
        paymentMethod: string;
      };
      customerId?: string | null;
    };

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "El carrito está vacío" },
        { status: 400 },
      );
    }
    if (!customer.customerName || !customer.customerEmail) {
      return NextResponse.json(
        { error: "Datos de cliente incompletos" },
        { status: 400 },
      );
    }

    const order = await prisma.order.create({
      data: {
        customerId: customerId || null,
        customerName: customer.customerName,
        customerEmail: customer.customerEmail,
        customerPhone: customer.customerPhone ?? null,
        address: customer.address,
        city: customer.city,
        postalCode: customer.postalCode,
        paymentMethod: customer.paymentMethod,
        total: total,
        status: "pending",
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            size: item.size ?? null,
          })),
        },
      },
      include: { items: true },
    });

    return NextResponse.json({ orderId: order.id }, { status: 201 });
  } catch (error) {
    console.error("Error creando orden:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}

// NUEVO: GET para listar órdenes (solo admin/manager)
export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("bt_auth")?.value;
  if (!token) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const payload = await verifyAuthToken(token);
  if (!payload || (payload.role !== "ADMIN" && payload.role !== "MANAGER")) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }

  const orders = await prisma.order.findMany({
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(orders);
}
