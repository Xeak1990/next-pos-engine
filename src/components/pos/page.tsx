"use client"; // Nota: Si vas a usar estados globales, mantenlo como client o cámbialo a Server Component según tu arquitectura

import ProductListClient from "../../components/pos/ProductListClient";
import CartPanel from "../../components/pos/CartPanel";
import { useEffect, useState } from "react";

export default function PosPage() {
  const [products, setProducts] = useState([]);

  // Simulando la carga de datos de la API (RF01, RF08)
  useEffect(() => {
    async function loadProducts() {
      const res = await fetch('/api/products'); // [cite: 214]
      const data = await res.json();
      setProducts(data);
    }
    loadProducts();
  }, []);

  return (
    /** * RNF-FE01: Interfaz responsiva y bloqueada a la altura de la pantalla
     * Esto asegura que el CartPanel no crezca infinitamente.
     */
    <main className="h-screen w-full bg-[#0F0F0F] grid grid-cols-12 overflow-hidden">
      
      {/* SECCIÓN CATÁLOGO (Columna Izquierda - Mockup 6) */}
      <section className="col-span-8 h-full overflow-y-auto custom-scrollbar p-6">
        <div className="max-w-7xl mx-auto">
          {/* CORRECCIÓN ERROR 2741: Pasamos los productos requeridos */}
          <ProductListClient products={products} />
        </div>
      </section>

      {/* SECCIÓN CARRITO (Columna Derecha - Mockup 7) 
          El 'h-full' aquí es vital para que el CartPanel sepa dónde está el fondo.
      */}
      <aside className="col-span-4 h-full border-l border-[#333333] bg-[#1A1A1A]">
        <CartPanel />
      </aside>

    </main>
  );
}