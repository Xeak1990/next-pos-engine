import { prisma } from "../../lib/prisma";
export default async function ShopPage() {

  const products = await prisma.product.findMany({
    include: {
      variants: {
        include: {
          inventory: true
        }
      }
    }
  });

  return (
    <main className="p-8 font-sans">
      <header className="mb-10 border-b pb-4">
        <h1 className="text-4xl font-black text-blue-900 uppercase">Ben Tenison 👟</h1>
        <p className="text-gray-500">Catálogo oficial - Sucursal Xalapa</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {products.map((product) => (
          <div key={product.id} className="bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="p-6">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">{product.brand}</span>
              <h2 className="text-2xl font-bold mt-1 text-gray-800">{product.name}</h2>
              <p className="text-sm text-gray-500 mt-2 line-clamp-2">{product.description}</p>
              
              <div className="mt-6 space-y-3">
                <p className="text-sm font-semibold text-gray-700">Tallas disponibles:</p>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((variant) => (
                    <span key={variant.id} className="px-3 py-1 bg-gray-100 text-xs rounded-full border">
                      {variant.size} - ${variant.price.toString()}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {products.length === 0 && (
        <div className="text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed">
          <p className="text-gray-400 font-medium">No hay productos en el inventario.</p>
        </div>
      )}
    </main>
  );
}