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
    <div className="text-white h-screen flex flex-col !overflow-hidden m-[5px]">
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Área de productos: ocupa todo el espacio restante */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <ProductListClient
            products={products}
            isLoading={isLoading}
            initialStoreLocation={initialStoreLocation}
            initialStoreName={initialStoreName}
          />
        </div>
        {/* Carrito: fijo a la derecha, no se colapsa */}
        <aside className="w-[320px] shrink-0 border-l border-[#333333] bg-[#0F0F0F] overflow-hidden">
          <CartPanel
            storeLocation={
              initialStoreLocation ?? initialStoreName ?? "Operación Global"
            }
          />
        </aside>
      </div>
    </div>
  );
}