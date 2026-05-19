import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

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
    const { items, total, customer } = body as {
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
    };

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "El carrito está vacío" }, { status: 400 });
    }
    if (!customer.customerName || !customer.customerEmail) {
      return NextResponse.json({ error: "Datos de cliente incompletos" }, { status: 400 });
    }

    const order = await prisma.order.create({
      data: {
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
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}