"use client";

import { useState } from "react";
import { formatCurrency } from "../../lib/utils";
import { useCart } from "../../lib/CartContext";

/**
 * RF01: Interfaz estricta basada en el Diccionario de Datos[cite: 228, 379].
 * Se eliminan los tipos 'any' para garantizar la integridad del sistema.
 */
export interface PosProduct {
  id: string;
  name: string;
  brand: string;
  category: string;
  size: string;
  price: string;
  stock: number;
  storeName: string; // En el mapeo del servidor, este campo debe recibir 'item.store.location'
}

export default function ProductListClient({
  products,
}: {
  products: PosProduct[];
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("TODOS");

  /** * Sincronización con DB: El valor inicial debe coincidir exactamente
   * con la columna 'location' de tu tabla Store.
   */
  const [selectedStore, setSelectedStore] = useState(
    "Plaza Americas, Xalapa, Ver.",
  );

  const { addItem } = useCart();

  const normalizeString = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");


  // Categorías oficiales según Mockup 6 [cite: 306]
  const categories = [
    "TODOS",
    "RUNNING",
    "CASUAL",
    "SPORT",
    "SKATE",
    "LIFESTYLE",
  ];

  const normalizedSelectedStore = normalizeString(selectedStore);
  const selectedCategoryNormalized = normalizeString(selectedCategory);

  console.log("ProductListClient products:", products, "selectedStore:", selectedStore, "normalizedStore:", normalizedSelectedStore);

  /**
   * RF08: Lógica de filtrado omnicanal por sucursal y categoría[cite: 228].
   * Se usa normalización con trim() y toLowerCase() en ambas partes.
   */

  const filteredProducts = products.filter((p: PosProduct) => {
    const storeName = normalizeString(p.storeName || "");
    const matchesStore = storeName === normalizedSelectedStore;

    const category = normalizeString(p.category || "");
    const matchesCategory =
      selectedCategory === "TODOS" ||
      category === selectedCategoryNormalized;

    const normalizedSearch = normalizeString(searchTerm);
    const matchesSearch =
      normalizedSearch === "" ||
      normalizeString(p.name).includes(normalizedSearch) ||
      normalizeString(p.size).includes(normalizedSearch);

    return matchesStore && matchesCategory && matchesSearch;
  });
  return (
    <div className="space-y-6">
      {/* Selector de Sucursal - Estética Mockup 6 [cite: 306, 434] */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-[#1A1A1A] p-6 rounded-[12px] border border-[#333333]">
        <div className="flex items-center gap-4">
          <div className="w-3 h-3 bg-[#E8621A] rounded-full animate-pulse"></div>
          <span className="text-2xl font-bebas tracking-widest text-white uppercase">
            TERMINAL POS
          </span>
          <select
            value={selectedStore}
            onChange={(e) => setSelectedStore(e.target.value)}
            className="bg-[#0F0F0F] text-[#E8621A] font-bold py-2 px-4 rounded-[8px] border border-[#333333] outline-none uppercase text-xs cursor-pointer"
          >
            {/* Los valores deben ser las ubicaciones exactas de Prisma Studio  */}
            <option value="Plaza Americas, Xalapa, Ver.">PLAZA AMÉRICAS</option>
            <option value="Centro, Xalapa, Ver.">CENTRO XALAPA</option>
            <option value="Plaza Crystal, Xalapa, Ver.">PLAZA CRYSTAL</option>
          </select>
        </div>

        {/* Buscador con validación en tiempo real [cite: 168] */}
        <div className="relative w-full md:w-96">
          <input
            type="text"
            placeholder="BUSCAR MODELO O TALLA..."
            className="w-full bg-[#0F0F0F] border border-[#333333] p-3 pl-10 rounded-[8px] text-white font-sans text-[10px] uppercase tracking-widest focus:border-[#E8621A] outline-none transition-all"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="absolute left-3 top-3 opacity-30 text-xs">🔍</span>
        </div>
      </div>

      {/* Pestañas de Categoría con estilos de Guía de Estilo [cite: 434, 436] */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-8 py-3 rounded-[8px] font-bebas text-sm tracking-widest transition-all ${
              selectedCategory === cat
                ? "bg-[#E8621A] text-white shadow-[0_0_24px_rgba(232,98,26,0.3)]"
                : "bg-[#1A1A1A] text-gray-500 hover:text-white border border-[#333333]"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid de Productos - Tarjetas Normalizadas (3FN) [cite: 186, 456] */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product: PosProduct) => (
            <div
              key={product.id}
              className={`p-8 bg-[#1A1A1A] border border-[#333333] rounded-[12px] shadow-[0_1px_4px_rgba(0,0,0,0.4)] flex flex-col justify-between transition-all hover:border-[#E8621A] ${
                product.stock === 0 ? "opacity-50 grayscale" : ""
              }`}
            >
              <div className="mb-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-3xl font-bebas text-white uppercase leading-none tracking-tight">
                    {product.name}
                  </h3>
                  <span className="bg-[#0F0F0F] px-3 py-1 rounded-[4px] text-[10px] font-mono font-bold text-[#E8621A] border border-[#333333]">
                    T- {product.size}
                  </span>
                </div>
                <p className="text-2xl font-mono font-bold text-[#2ECC71]">
                  {formatCurrency(product.price)}
                </p>
                {product.stock === 0 && (
                  <span className="mt-4 inline-flex items-center px-3 py-1 rounded-full bg-[#E74C3C] text-[10px] font-bold uppercase tracking-widest text-white">
                    AGOTADO
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-gray-900 pt-6">
                {/* RF07: Alerta visual de stock crítico (<= 2 unidades) [cite: 228, 434] */}
                <span
                  className={`text-[10px] font-bold uppercase tracking-widest ${
                    product.stock <= 2 ? "text-[#E74C3C]" : "text-gray-500"
                  }`}
                >
                  Stock: {product.stock} UDS
                </span>

                {product.stock > 0 && (
                  <button
                    onClick={() =>
                      addItem(
                        {
                          variantId: product.id,
                          name: product.name,
                          size: product.size,
                          price: Number(product.price),
                          quantity: 1,
                          stockAvailable: product.stock, // Pasamos el stock real para validación en CartContext
                        },
                        product.stock,
                      )
                    }
                    className="bg-[#E8621A] text-white px-8 py-3 rounded-[8px] font-bebas text-lg tracking-widest hover:bg-[#FF7A2F] active:scale-[0.97] transition-all"
                  >
                    AGREGAR
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center border border-dashed border-[#333333] rounded-[12px]">
            <p className="text-gray-600 font-bebas text-xl tracking-widest uppercase">
              No hay productos disponibles en esta sucursal
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
