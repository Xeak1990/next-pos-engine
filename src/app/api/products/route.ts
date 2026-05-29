import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,        // Incluir la categoría relacionada
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
          id: `${variant.id}-${inventoryItem.storeId}`,
          name: product.name,
          brand: product.brand,
          category: product.category.name,   // ← ahora usamos el nombre desde la relación
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
    return NextResponse.json(
      { error: "Error al cargar productos" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, brand, categoryId, color, size, price, stock, storeId } = body;

    // Validar campos obligatorios (ahora categoryId en lugar de category)
    if (
      !name ||
      !brand ||
      !categoryId ||
      !color ||
      !size ||
      price === undefined ||
      stock === undefined ||
      !storeId
    ) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios" },
        { status: 400 },
      );
    }

    const priceNum = parseFloat(price);
    const stockNum = parseInt(stock, 10);
    if (isNaN(priceNum) || priceNum < 0 || isNaN(stockNum) || stockNum < 0) {
      return NextResponse.json(
        { error: "Precio o stock inválidos" },
        { status: 400 },
      );
    }

    // Verificar que la categoría exista
    const categoryExists = await prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!categoryExists) {
      return NextResponse.json(
        { error: "Categoría inválida. Debe seleccionar una categoría existente." },
        { status: 400 },
      );
    }

    // Crear el producto (siempre nuevo, sin buscar duplicados)
    const product = await prisma.product.create({
      data: {
        name,
        brand,
        description: `${brand} ${name}`,
        categoryId,           // ← usamos la FK
      },
    });

    const variant = await prisma.variant.create({
      data: {
        sku: `${brand}-${name}-${color}-${size}`
          .toUpperCase()
          .replace(/\s/g, "-"),
        size,
        color,
        price: priceNum,
        productId: product.id,
      },
    });

    const inventory = await prisma.inventory.create({
      data: {
        quantity: stockNum,
        storeId,
        variantId: variant.id,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Producto creado",
        variantId: variant.id,
        inventoryId: inventory.id,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error al crear producto:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}