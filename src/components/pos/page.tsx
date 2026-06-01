"use client";

import { useEffect, useState } from "react";
import CartPanel from "./CartPanel";
import ProductListClient, { PosProduct } from "./ProductListClient";

interface PosPageProps {
  initialStoreLocation?: string | null;
  initialStoreName?: string | null;
  storeId?: string | null;
}

export default function PosPage({
  initialStoreLocation,
  initialStoreName,
  storeId,
}: PosPageProps) {
  const [products, setProducts] = useState<PosProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadProducts() {
      setIsLoading(true);
      try {
        const response = await fetch("/api/products");
        const data = await response.json();
        setProducts(Array.isArray(data) ? data : []);
        console.log("[PosPage] Productos cargados:", data.length);
        if (data.length > 0) {
          console.log("[PosPage] Ejemplo storeName:", data[0].storeName);
        }
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
        <div className="flex-1 min-w-0 overflow-hidden">
          <ProductListClient
            products={products}
            isLoading={isLoading}
            initialStoreLocation={initialStoreLocation}
            initialStoreName={initialStoreName}
          />
        </div>
        <aside className="w-[320px] shrink-0 border-l border-[#333333] bg-[#0F0F0F] overflow-hidden">
          <CartPanel
            storeLocation={initialStoreLocation ?? initialStoreName ?? "Operación Global"}
            storeId={storeId ?? ""}
          />
        </aside>
      </div>
    </div>
  );
}