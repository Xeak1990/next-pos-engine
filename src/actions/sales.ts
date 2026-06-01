"use server";

import { prisma } from "../lib/prisma";
import { revalidatePath } from "next/cache";

interface SaleInput {
  storeId: string;
  items: {
    variantId: string;
    quantity: number;
    price: number;
  }[];
}

export async function createSale(data: SaleInput) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const subtotal = data.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
      const total = subtotal * 1.16; // IVA incluido

      const sale = await tx.sale.create({
        data: {
          storeId: data.storeId,
          total: total,
          items: {
            create: data.items.map((item) => ({
              variantId: item.variantId,
              quantity: item.quantity,
              price: item.price,
              salePrice: item.price,
            })),
          },
        },
      });

      // Actualizar inventario de forma eficiente (sin N+1)
      for (const item of data.items) {
        const updateResult = await tx.inventory.updateMany({
          where: {
            storeId: data.storeId,
            variantId: item.variantId,
            quantity: { gte: item.quantity }, // Solo si hay stock suficiente
          },
          data: { quantity: { decrement: item.quantity } },
        });

        if (updateResult.count === 0) {
          throw new Error(`Stock insuficiente para la variante: ${item.variantId}`);
        }
      }

      return sale;
    });

    revalidatePath("/(shop)");
    revalidatePath("/(admin)/inventory");

    return { success: true, saleId: result.id };
  } catch (error: unknown) {
    let errorMessage = "Ocurrió un error al procesar la venta.";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    console.error("Error en transacción de venta:", error);
    return { success: false, error: errorMessage };
  }
}