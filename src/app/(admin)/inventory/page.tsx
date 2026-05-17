import InventoryTable from "../../../components/admin/InventoryTable";
import { prisma } from "../../../lib/prisma";

export default async function InventoryPage() {
  const inventoryData = await prisma.inventory.findMany({
    include: {
      variant: {
        include: {
          product: true,
        },
      },
      store: true,
    },
    orderBy: {
      variant: {
        product: {
          name: "asc",
        },
      },
    },
  });

  const serializedInventory = inventoryData.map((item) => ({
    id: item.id,
    quantity: item.quantity,
    storeId: item.storeId,
    storeName: item.store.name,
    storeLocation: item.store.location,
    variant: {
      size: item.variant.size,
      color: item.variant.color,
      price: item.variant.price.toString(),
      product: {
        name: item.variant.product.name,
      },
    },
  }));

  return (
    <div className="min-h-screen bg-[#0F0F0F] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="space-y-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.36em] text-[#94A3B8]">Existencias</p>
            <h1 className="mt-3 text-5xl tracking-wider text-white">Inventario</h1>
            <p className="mt-3 max-w-2xl text-sm text-[#9CA3AF]">
              Control de stock por sucursal con filtros visuales y lectura rapida por talla.
            </p>
          </div>

          <div className="bt-panel-blue px-5 py-4">
            <p className="text-xs uppercase tracking-[0.3em] text-[#C9D8EA]">Variantes activas</p>
            <p className="mt-2 font-mono text-2xl font-bold text-white">
              {serializedInventory.length}
            </p>
          </div>
        </header>

        {serializedInventory.length > 0 ? (
          <InventoryTable initialData={serializedInventory} />
        ) : (
          <div className="bt-panel px-6 py-16 text-center">
            <p className="text-3xl text-white">No hay productos en inventario</p>
            <p className="mt-3 text-sm text-[#9CA3AF]">
              Ejecuta el seed o agrega variantes para poblar esta vista.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
