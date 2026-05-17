"use client";

import { useState } from "react";
import { formatCurrency } from "../../lib/utils";
import { useCart } from "../../lib/CartContext";

export interface PosProduct {
  id: string;
  name: string;
  brand: string;
  category: string;
  size: string;
  price: string;
  stock: number;
  storeName: string;
}

function normalizeString(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export default function ProductListClient({
  products,
  isLoading,
  initialStoreLocation,
  initialStoreName,
}: {
  products: PosProduct[];
  isLoading?: boolean;
  initialStoreLocation?: string | null;
  initialStoreName?: string | null;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("TODOS");
  const [selectedStore, setSelectedStore] = useState(initialStoreLocation ?? "");
  const { addItem } = useCart();

  const storeOptions = Array.from(
    new Set(products.map((product) => product.storeName).filter(Boolean)),
  ).sort((left, right) => left.localeCompare(right, "es"));

  const categoryOptions = [
    "TODOS",
    ...Array.from(
      new Set(products.map((product) => product.category).filter(Boolean)),
    ).sort((left, right) => left.localeCompare(right, "es")),
  ];

  const activeStore =
    storeOptions.includes(selectedStore)
      ? selectedStore
      : initialStoreLocation && storeOptions.includes(initialStoreLocation)
        ? initialStoreLocation
        : storeOptions[0] || "";

  const selectedStoreNormalized = normalizeString(activeStore);
  const selectedCategoryNormalized = normalizeString(selectedCategory);
  const normalizedSearch = normalizeString(searchTerm);

  const filteredProducts = products.filter((product) => {
    const matchesStore =
      !selectedStoreNormalized ||
      normalizeString(product.storeName || "") === selectedStoreNormalized;

    const matchesCategory =
      selectedCategory === "TODOS" ||
      normalizeString(product.category || "") === selectedCategoryNormalized;

    const matchesSearch =
      !normalizedSearch ||
      normalizeString(product.name).includes(normalizedSearch) ||
      normalizeString(product.brand).includes(normalizedSearch) ||
      normalizeString(product.size).includes(normalizedSearch);

    return matchesStore && matchesCategory && matchesSearch;
  });

  return (
    <section className="bt-panel flex h-full min-h-[calc(100vh-140px)] flex-col overflow-hidden lg:min-h-0">
      <div className="border-b border-[#333333] bg-[#1A1A1A] px-5 py-5 sm:px-6">
        <div className="mb-5">
          <p className="text-xs uppercase tracking-[0.32em] text-[#94A3B8]">Punto de Venta</p>
          <h1 className="mt-3 text-4xl tracking-wider text-white">Terminal POS</h1>
        </div>

        <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
          <div className="rounded-[12px] border border-[#333333] bg-[#111111] px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.22em] text-[#94A3B8]">Sucursal</p>
            <select
              value={activeStore}
              onChange={(event) => setSelectedStore(event.target.value)}
              disabled={Boolean(initialStoreLocation)}
              className="mt-2 w-full border-none bg-transparent px-0 py-0 text-sm font-semibold text-[#E8621A] disabled:cursor-not-allowed disabled:text-[#D1D5DB]"
            >
              {storeOptions.map((store) => (
                <option key={store} value={store} className="bg-[#1A1A1A] text-white">
                  {store}
                </option>
              ))}
            </select>
            {initialStoreLocation && (
              <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-[#C9D8EA]">
                Sucursal bloqueada para {initialStoreName || "usuario operativo"}
              </p>
            )}
          </div>

          <label className="rounded-[12px] border border-[#333333] bg-[#111111] px-4 py-3">
            <span className="text-[11px] uppercase tracking-[0.22em] text-[#94A3B8]">Busqueda</span>
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar modelo, marca o talla"
              className="mt-2 w-full border-none bg-transparent px-0 py-0 text-sm text-white placeholder:text-[#6B7280]"
            />
          </label>
        </div>
      </div>

      <div className="border-b border-[#333333] bg-[#151515] px-5 py-4 sm:px-6">
        <div className="flex gap-2 overflow-x-auto whitespace-nowrap">
          {categoryOptions.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
              className={
                selectedCategory === category
                  ? "bt-button-primary shrink-0 px-4 py-2 text-xs"
                  : "bt-button-ghost shrink-0 px-4 py-2 text-xs"
              }
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 sm:p-6">
        {isLoading ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="animate-pulse rounded-[12px] border border-[#333333] bg-[#141414] p-6"
              >
                <div className="h-5 w-2/3 rounded bg-white/10" />
                <div className="mt-3 h-4 w-1/3 rounded bg-white/10" />
                <div className="mt-8 h-10 w-full rounded bg-white/10" />
              </div>
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredProducts.map((product) => (
              <article
                key={product.id}
                className={`rounded-[12px] border bg-[#151515] p-6 transition-all hover:border-[#E8621A] hover:shadow-[0_14px_34px_rgba(0,0,0,0.22)] ${
                  product.stock === 0 ? "border-[#333333] opacity-65" : "border-[#333333]"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-[#94A3B8]">
                      {product.brand} / {product.category}
                    </p>
                    <h2 className="mt-3 text-3xl leading-none tracking-wider text-white">
                      {product.name}
                    </h2>
                  </div>
                  <span className="rounded-[8px] border border-[#333333] bg-[#0F0F0F] px-3 py-1 font-mono text-xs font-semibold text-[#E8621A]">
                    T-{product.size}
                  </span>
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <p className="font-mono text-2xl font-bold text-[#2ECC71]">
                    {formatCurrency(product.price)}
                  </p>
                  {product.stock === 0 && (
                    <span className="rounded-full border border-[#E8621A]/40 bg-[#E8621A]/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#E8621A]">
                      Agotado
                    </span>
                  )}
                </div>

                <div className="mt-8 flex items-end justify-between gap-4 border-t border-[#2A2A2A] pt-5">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.22em] text-[#94A3B8]">Stock</p>
                    <p
                      className={`mt-2 font-mono text-sm font-semibold ${
                        product.stock <= 2 ? "text-[#E8621A]" : "text-white"
                      }`}
                    >
                      {product.stock} uds
                    </p>
                  </div>

                  {product.stock > 0 ? (
                    <button
                      type="button"
                      onClick={() =>
                        addItem(
                          {
                            variantId: product.id,
                            name: product.name,
                            size: product.size,
                            price: Number(product.price),
                            quantity: 1,
                            stockAvailable: product.stock,
                          },
                          product.stock,
                        )
                      }
                      className="bt-button-primary px-5 py-3 text-xs"
                    >
                      Agregar
                    </button>
                  ) : (
                    <div className="rounded-[8px] border border-[#333333] bg-[#0F0F0F] px-4 py-3 text-[11px] uppercase tracking-[0.22em] text-[#6B7280]">
                      Sin stock
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-[12px] border border-dashed border-[#333333] bg-[#141414] px-6 py-16 text-center">
            <p className="text-2xl text-white">No hay productos disponibles</p>
            <p className="mt-3 text-sm text-[#9CA3AF]">
              Ajusta la sucursal, categoria o termino de busqueda para continuar.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
