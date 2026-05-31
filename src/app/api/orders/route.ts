import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { verifyAuthToken } from "../../../lib/token-utils";
import { cookies } from "next/headers";

interface OrderItemInput {
  productId: string;
  variantId: string;
  name: string;
  price: number;
  quantity: number;
  size?: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, total, customer, customerId, deliveryMethod, storeId, pickupStoreId } = body as {
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
      deliveryMethod?: string;
      storeId?: string | null;
      pickupStoreId?: string | null;
    };

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "El carrito está vacío" }, { status: 400 });
    }
    if (!customer.customerName || !customer.customerEmail) {
      return NextResponse.json({ error: "Datos de cliente incompletos" }, { status: 400 });
    }

    // 1. Crear la orden
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

    // 2. Reducir stock en la tienda correspondiente
    // Para pickup: la tienda de recogida puede ser diferente a la tienda del stock.
    // En nuestro modelo, el carrito ya tiene una tienda común (storeId) que es de donde se toman los productos.
    // Usamos esa tienda para reducir stock.
    if (storeId) {
      for (const item of items) {
        const inventory = await prisma.inventory.findFirst({
          where: {
            variantId: item.variantId,
            storeId: storeId,
          },
        });
        if (inventory) {
          const newQty = Math.max(0, inventory.quantity - item.quantity);
          await prisma.inventory.update({
            where: { id: inventory.id },
            data: { quantity: newQty },
          });
        } else {
          console.warn(`No inventory for variant ${item.variantId} in store ${storeId}`);
        }
      }
    }

    return NextResponse.json({ orderId: order.id }, { status: 201 });
  } catch (error) {
    console.error("Error creando orden:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// GET para listar órdenes (admin/manager) se mantiene igual