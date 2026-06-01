import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
        variants: {
          include: {
            inventory: {
              include: { store: true },
            },
          },
        },
      },
    });

    const posProducts = products.flatMap((product) =>
      product.variants.flatMap((variant) =>
        variant.inventory.map((inventoryItem) => ({
          id: variant.id,                            // ID real de la variante
          name: product.name,
          brand: product.brand,
          category: product.category.name,
          size: variant.size,
          price: String(variant.price),
          stock: inventoryItem.quantity,
          storeName: inventoryItem.store?.name || "",   // ✅ nombre comercial
          storeLocation: inventoryItem.store?.location || "",
        })),
      ),
    );

    console.log("📦 Productos devueltos por API:", posProducts.length);
    if (posProducts.length > 0) {
      console.log("🔍 Ejemplo de storeName:", posProducts[0].storeName);
    }
    return NextResponse.json(posProducts);
  } catch (error) {
    console.error("Error en API de productos:", error);
    return NextResponse.json({ error: "Error al cargar productos" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // ... (sin cambios, igual que antes)
}