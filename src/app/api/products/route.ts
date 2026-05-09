import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma"; 

export async function GET() {
  try {
    // Obtenemos productos con sus variantes e inventario, incluyendo la sucursal.
    const products = await prisma.product.findMany({
      include: {
        variants: {
          include: {
            inventory: {
              include: {
                store: true,
              },
            },
          },
        },
      },
    });

    const posProducts = products.flatMap((product) =>
      product.variants.flatMap((variant) =>
        variant.inventory.map((inventoryItem) => ({
          id: `${variant.id}-${inventoryItem.storeId}`,
          name: product.name,
          brand: product.brand,
          category: product.category,
          size: variant.size,
          price: String(variant.price),
          stock: inventoryItem.quantity,
          storeName: inventoryItem.store?.location || "",
        })),
      ),
    );

    return NextResponse.json(posProducts);
  } catch (error) {
    console.error("Error en API de productos:", error);
    return NextResponse.json({ error: "Error al cargar productos" }, { status: 500 });
  }
}