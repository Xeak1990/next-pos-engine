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
    <div className="min-h-screen px-4 py-6 text-white sm:px-6 lg:px-8 m-[5px]">
      <div className="space-y-6">

        {serializedInventory.length > 0 ? (
          <InventoryTable initialData={serializedInventory} />
        ) : (
          <div className="bt-panel px-6 py-16 text-center">
            <p className="text-3xl text-white">
              No hay productos en inventario    
            </p>
            <p className="mt-3 text-sm text-[#9CA3AF]">
              Ejecuta el seed o agrega variantes para poblar esta vista.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
