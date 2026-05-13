import { prisma } from "../../lib/prisma";
import ProductCard from "../../components/shop/ProductCard";
import { Product } from "../../types";
import { Prisma } from "@prisma/client"; // Importamos Prisma para usar ProductGetPayload

// Definición de tipo para la consulta con relaciones (3FN) [cite: 185, 208]
type ProductWithRelations = Prisma.ProductGetPayload<{
  include: {
    variants: {
      include: {
        inventory: {
          include: {
            store: true;
          };
        };
      };
    };
  };
}>;

export default async function ShopPage() {
  // RF08: Consulta de disponibilidad en tiempo real [cite: 74, 87]
  const productsFromDb = await prisma.product.findMany({
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
  }) as ProductWithRelations[];

  // Mapeo a la interfaz del sistema para cumplir con RF01 y RF08 [cite: 228]
  const serializedProducts: Product[] = productsFromDb.map((p) => ({
    id: p.id,
    name: p.name,
    brand: p.brand,
    category: p.category,
    variants: p.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      size: v.size,
      color: v.color,
      price: v.price.toString(), // Serialización para evitar errores de Decimal [cite: 170, 200]
      inventory: v.inventory.map((i) => ({
        quantity: i.quantity,
        store: {
          id: i.store.id,
          name: i.store.name,
          location: i.store.location,
        },
      })),
    })),
  }));

  return (
    <main className="min-h-screen bg-[#0F0F0F] px-6 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <header className="mb-10">
          <p className="text-sm uppercase tracking-[0.36em] text-[#94A3B8]">Catalogo</p>
          <h1 className="mt-3 text-5xl text-white">Ben Tenison</h1>
          <p className="mt-3 text-sm text-[#9CA3AF]">
            Consulta disponibilidad y precios por variante en tiempo real.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {serializedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </main>
  );
}
