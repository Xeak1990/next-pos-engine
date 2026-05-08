import { prisma } from "../../../lib/prisma";
import ProductListClient from "../../../components/pos/ProductListClient";
import CartPanel from "../../../components/pos/CartPanel";

export default async function TerminalPage() {
  // RF07 y RF08: Obtenemos el inventario detallado por sucursal [cite: 228]
  const inventoryData = await prisma.inventory.findMany({
    include: {
      store: true,
      variant: {
        include: {
          product: true,
        },
      },
    },
  });

  console.log("Inventario encontrado:", JSON.stringify(inventoryData, null, 2));

  // Mapeo estricto basado en el Diccionario de Datos [cite: 379]
  const products = inventoryData.map((item) => ({
    id: item.variant.id,
    name: item.variant.product.name,
    brand: item.variant.product.brand,
    category: item.variant.product.category,
    size: item.variant.size,
    price: item.variant.price.toString(),
    stock: item.quantity,
    // CAMBIO CLAVE: Usamos location porque name es genérico ("Ben Tenison")
    storeName: item.store.location,
  }));

  return (
    // Estructura de dos columnas según Mockup 6 y 7 [cite: 48, 49]
    <main className="flex flex-col lg:flex-row min-h-screen bg-[#0F0F0F]">
      {/* SECCIÓN IZQUIERDA: PRODUCTOS (75% de ancho) [cite: 292] */}
      <section className="flex-grow p-8 lg:w-3/4">
        <ProductListClient products={products} />
      </section>

      {/* SECCIÓN DERECHA: CARRITO (25% de ancho) [cite: 293] */}
      {/* Aquí usamos CartPanel, eliminando el error de 'unused-vars' */}
      <aside className="lg:w-1/4 border-l border-[#333333] sticky top-0 h-screen overflow-hidden">
        <CartPanel />
      </aside>
    </main>
  );
}
