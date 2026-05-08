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
    <main className="p-8 max-w-7xl mx-auto bg-bt-dark min-h-screen">
      <header className="mb-12">
        <h1 className="text-5xl font-bebas text-bt-orange mb-2 uppercase">
          Catálogo Ben Tenison
        </h1>
        <p className="text-gray-400 font-sans">
          Consulta la disponibilidad de tus tenis favoritos en nuestras sucursales. [cite: 126]
        </p>
      </header>

      {/* Grid responsivo según Guía de Estilos [cite: 432, 459] */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {serializedProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </main>
  );
}