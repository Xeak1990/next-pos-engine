"use server"; // Indica que esto corre solo en el servidor

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
    // RF07: Transacción para asegurar consistencia entre venta y stock [cite: 217, 224]
    const result = await prisma.$transaction(async (tx) => {
      // 1. Calcular el total de la venta (incluyendo lógica de RF06) [cite: 84, 298]
      const subtotal = data.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
      const total = subtotal * 1.16; // IVA incluido [cite: 298, 301]

      // 2. Crear el registro de la venta [cite: 228]
      const sale = await tx.sale.create({
        data: {
          storeId: data.storeId,
          total: total,
          items: {
            create: data.items.map((item) => ({
              variantId: item.variantId,
              quantity: item.quantity,
              price: item.price,
              salePrice: item.price, // Aquí podrías aplicar descuentos de RF06 [cite: 84, 228]
            })),
          },
        },
      });

      // 3. Actualizar el inventario en tiempo real (RF07) [cite: 192, 217]
      for (const item of data.items) {
        const inventory = await tx.inventory.findUnique({
          where: {
            storeId_variantId: {
              storeId: data.storeId,
              variantId: item.variantId,
            },
          },
        });

        if (!inventory || inventory.quantity < item.quantity) {
          throw new Error(`Stock insuficiente para la variante: ${item.variantId}`); 
        }

        await tx.inventory.update({
          where: { id: inventory.id },
          data: { quantity: { decrement: item.quantity } },
        });
      }

      return sale;
    });

    // Revalidar rutas para que el catálogo web y admin vean el stock actualizado [cite: 218, 219]
    revalidatePath("/(shop)");
    revalidatePath("/(admin)/inventory");

    return { success: true, saleId: result.id };
  } catch (error: unknown) {
    let errorMessage = "Ocurrio un error al procesar la venta.";
    if(error instanceof Error) {
      errorMessage = error.message;
    }
    console.error("Error en transacción de venta:", error);
    return { 
        success: false, 
        error: errorMessage 
    };
  }
}