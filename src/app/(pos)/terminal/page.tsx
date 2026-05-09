"use client";

import { useEffect, useState } from "react";
import ProductListClient, { PosProduct } from "../../../components/pos/ProductListClient";
import CartPanel from "../../../components/pos/CartPanel";

export default function TerminalPage() {
  const [products, setProducts] = useState<PosProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProducts() {
      try {
        const res = await fetch('/api/products');
        if (!res.ok) throw new Error("Error en la red");
        const data: PosProduct[] = await res.json();
        setProducts(data);
      } catch (err) {
        console.error("Error cargando productos:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  return (
    /** * RNF-FE01: Layout de pantalla completa.
     * El 'h-[calc(100vh-64px)]' y 'overflow-hidden' son obligatorios para que 
     * el botón de pagar se mantenga anclado abajo.
     */
    <div className="flex h-[calc(100vh-64px)] w-full bg-[#0F0F0F] overflow-hidden font-sans">
      
      {/* SECCIÓN IZQUIERDA: CATÁLOGO (Flexible) [cite: 306] */}
      <main className="flex-1 h-full overflow-y-auto p-6 custom-scrollbar">
        <div className="max-w-6xl mx-auto">
          <header className="mb-6 flex justify-between items-center border-b border-[#333333] pb-4">
            <h1 className="text-2xl font-bebas text-white tracking-widest uppercase">
              TERMINAL POS <span className="text-[#E8621A] ml-2">PLAZA AMÉRICAS</span>
            </h1>
          </header>
          
          {loading ? (
            <div className="text-white font-mono text-xs animate-pulse">CARGANDO INVENTARIO...</div>
          ) : (
            <ProductListClient products={products} />
          )}
        </div>
      </main>

      {/* SECCIÓN DERECHA: CARRITO FIJO (Ancho 400px) [cite: 308] */}
      <aside className="w-[400px] h-full min-h-0 border-l border-[#333333] flex-none bg-[#1A1A1A]">
        <CartPanel />
      </aside>

    </div>
  );
}