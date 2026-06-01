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
  console.log("[createSale] Iniciando venta con datos:", JSON.stringify(data, null, 2));
  try {
    const result = await prisma.$transaction(async (tx) => {
      const subtotal = data.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
      const total = subtotal * 1.16; // IVA incluido
      console.log(`[createSale] Subtotal: ${subtotal}, Total con IVA: ${total}`);

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
      console.log(`[createSale] Venta creada con ID: ${sale.id}`);

      // Actualizar inventario
      for (const item of data.items) {
        console.log(`[createSale] Actualizando inventario para variante: ${item.variantId}, cantidad: ${item.quantity}`);
        const updateResult = await tx.inventory.updateMany({
          where: {
            storeId: data.storeId,
            variantId: item.variantId,
            quantity: { gte: item.quantity }, // Solo si hay stock suficiente
          },
          data: { quantity: { decrement: item.quantity } },
        });

        if (updateResult.count === 0) {
          console.error(`[createSale] Stock insuficiente para variante: ${item.variantId} en tienda ${data.storeId}`);
          throw new Error(`Stock insuficiente para la variante: ${item.variantId}`);
        }
        console.log(`[createSale] Inventario actualizado: ${updateResult.count} registro(s) modificados`);
      }

      return sale;
    });

    revalidatePath("/(shop)");
    revalidatePath("/(admin)/inventory");
    console.log("[createSale] Venta finalizada con éxito, ID:", result.id);
    return { success: true, saleId: result.id };
  } catch (error: unknown) {
    let errorMessage = "Ocurrió un error al procesar la venta.";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    console.error("[createSale] Error en transacción:", error);
    return { success: false, error: errorMessage };
  }
}