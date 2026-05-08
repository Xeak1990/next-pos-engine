import { prisma } from "../../../lib/prisma";
import InventoryTable from "../../../components/admin/InventoryTable";

export default async function InventoryPage() {
  // 1. Obtenemos los datos de la DB con las relaciones necesarias (RF03)
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
          name: 'asc'
        }
      }
    }
  });

  // 2. Formateamos los datos para que coincidan con la interfaz de nuestro componente
  // Esto asegura que el tipado de TypeScript sea exacto
  const serializedInventory = inventoryData.map((item) => ({
    id: item.id,
    quantity: item.quantity,
    variant: {
      size: item.variant.size,
      color: item.variant.color,
      price: item.variant.price.toString(), // Convertimos Decimal a string para el cliente
      product: {
        name: item.variant.product.name,
      },
    },
  }));

  return (
    <div className="p-8 bg-bt-dark min-h-screen text-white">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bebas text-bt-orange tracking-wider">
            Gestión de Inventario
          </h1>
          <p className="text-gray-400 font-sans">
            Control de existencias en tiempo real por sucursal y variante.
          </p>
        </div>
        
        <div className="bg-bt-navy p-4 rounded-lg border border-blue-900/30">
          <span className="text-sm text-blue-200 block">Total de variantes</span>
          <span className="text-2xl font-mono font-bold">{serializedInventory.length}</span>
        </div>
      </div>

      {/* 3. Renderizamos la tabla que creamos antes */}
      <div className="mt-4">
        {serializedInventory.length > 0 ? (
          <InventoryTable initialData={serializedInventory} />
        ) : (
          <div className="bg-bt-surface p-12 text-center rounded-lg border border-dashed border-gray-800">
            <p className="text-gray-500">No hay productos en el inventario. Ejecuta el seed o agrega productos.</p>
          </div>
        )}
      </div>
    </div>
  );
}