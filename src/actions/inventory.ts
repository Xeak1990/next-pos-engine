"use server";

import { prisma } from "../lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateStock(inventoryId: string, amount: number) {
  try {
    const currentInventory = await prisma.inventory.findUnique({
      where: { id: inventoryId },
    });

    if (!currentInventory) throw new Error("Registro no encontrado");

    const newQuantity = currentInventory.quantity + amount;

    if (newQuantity < 0) {
      throw new Error("El stock no puede ser negativo");
    }

    await prisma.inventory.update({
      where: { id: inventoryId },
      data: { quantity: newQuantity },
    });

    // Revalida la página para que el dashboard y el catálogo vean el cambio (RF07)
    revalidatePath("/admin/inventory");
    revalidatePath("/shop");
    
    return { success: true };
  } catch (error) {
    console.error("Error al actualizar inventario:", error);
    return { success: false, error: "Error al actualizar stock" };
  }
}