"use client";

import { useEffect, useState } from "react";
import CartPanel from "./CartPanel";
import ProductListClient, { PosProduct } from "./ProductListClient";

export default function PosPage({
  initialStoreLocation,
  initialStoreName,
}: {
  initialStoreLocation?: string | null;
  initialStoreName?: string | null;
}) {
  const [products, setProducts] = useState<PosProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadProducts() {
      setIsLoading(true);

      try {
        const response = await fetch("/api/products");
        const data = await response.json();
        setProducts(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error cargando productos POS:", error);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadProducts();
  }, []);

  return (
    <main className="bg-[#0F0F0F] px-4 py-4 text-white lg:px-6">
      <div className="grid gap-6 lg:h-[calc(100vh-68px)] lg:grid-cols-[70%_30%]">
        <section className="min-w-0 lg:h-full">
          <ProductListClient
            products={products}
            isLoading={isLoading}
            initialStoreLocation={initialStoreLocation}
            initialStoreName={initialStoreName}
          />
        </section>

        <aside className="min-w-0 lg:h-full">
          <CartPanel storeLocation={initialStoreLocation ?? initialStoreName ?? "Operacion Global"} />
        </aside>
      </div>
    </main>
  );
}
