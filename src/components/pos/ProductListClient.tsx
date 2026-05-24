"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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

function formatLowercaseDate(date: Date) {
  return new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
    .format(date)
    .toLowerCase();
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
  const [selectedStore, setSelectedStore] = useState(
    initialStoreLocation ?? "",
  );
  const [userRole, setUserRole] = useState<string | null>(null);
  const { addItem } = useCart();

  // ============================================================
  // AJUSTES PERSONALIZABLES (ancho y altura en píxeles)
  // ============================================================
  const CARD_WIDTH_PX = 220;
  const STORE_SELECTOR_WIDTH_PX = 200;
  const STORE_SELECTOR_HEIGHT_PX = 65;
  const SEARCH_BAR_HEIGHT_PX = 65;
  // ============================================================

  const now = new Date();

  useEffect(() => {
    async function fetchUserRole() {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) return;
        const data = await res.json();
        const role = data.customer?.role?.toUpperCase();
        setUserRole(role || null);
      } catch (error) {
        console.error("Error fetching user role:", error);
      }
    }
    fetchUserRole();
  }, []);

  const storeOptions = Array.from(
    new Set(products.map((product) => product.storeName).filter(Boolean)),
  ).sort((left, right) => left.localeCompare(right, "es"));

  const categoryOptions = [
    "TODOS",
    ...Array.from(
      new Set(products.map((product) => product.category).filter(Boolean)),
    ).sort((left, right) => left.localeCompare(right, "es")),
  ];

  const activeStore = storeOptions.includes(selectedStore)
    ? selectedStore
    : initialStoreLocation && storeOptions.includes(initialStoreLocation)
      ? initialStoreLocation
      : storeOptions[0] || "";

  const hasFixedStore = Boolean(initialStoreLocation);
  const canChangeBranch = userRole === "ADMIN";
  const canEdit = !hasFixedStore || activeStore === initialStoreLocation;

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
    <section className="flex h-full flex-col m-[5px]">
      {/* Cabecera con migas de pan y título */}
      <div className="border-b border-[#333333] px-4 py-3">
        {/* Migas de pan */}
        <nav className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#666666]">
          <Link
            href="/"
            className="hover:text-white transition-colors duration-200"
          >
            Principal
          </Link>
          <span>/</span>
          <span className="text-[#e8621a]">Punto de venta</span>
        </nav>

        {/* Título principal estilo Dashboard */}
        <h1
          className="text-[38px] font-[900] uppercase text-white leading-none tracking-tight"
          style={{
            fontFamily: "Bebas Neue, sans-serif",
            transform: "scale(0.85, 1.15)",
            transformOrigin: "left center",
            WebkitTextStroke: "1.5px white",
            letterSpacing: "0.12em",
          }}
        >
          punto de venta
        </h1>

        {/* FECHA */}
        <p className="mt-[-8px] text-[16px] font-medium text-[#9CA3AF] lowercase opacity-80">
          {formatLowercaseDate(now)}
        </p>

        {/* Campos de sucursal y búsqueda con margen inferior de 5px */}
        <div
          className="mt-4 mb-[15px] grid gap-[15px]"
          style={{ gridTemplateColumns: `${STORE_SELECTOR_WIDTH_PX}px 1fr` }}
        >
          {/* Sucursal */}
          <div>
            <p
              className="text-[10px] uppercase tracking-[0.22em] text-[#94A3B8] mb-[5px]"
              style={{ fontFamily: "Arial, sans-serif" }}
            >
              Sucursal
            </p>
            <div
              className="rounded-[12px] border border-[#333333] bg-[#111111] px-3 py-2 flex flex-col justify-center"
              style={{ minHeight: STORE_SELECTOR_HEIGHT_PX }}
            >
              <select
                value={activeStore}
                onChange={(event) => setSelectedStore(event.target.value)}
                disabled={!canChangeBranch}
                className="w-full border-none bg-transparent px-0 py-0 text-xs font-semibold text-[#E8621A] disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ fontFamily: "Arial, sans-serif" }}
              >
                {storeOptions.map((store) => (
                  <option
                    key={store}
                    value={store}
                    className="bg-[#1A1A1A] text-white"
                  >
                    {store}
                  </option>
                ))}
              </select>
              {hasFixedStore && !canEdit && (
                <p
                  className="mt-1 text-[10px] uppercase tracking-[0.18em] text-[#E8621A]"
                  style={{ fontFamily: "Arial, sans-serif" }}
                >
                  ⚠️ Consulta
                </p>
              )}
              {hasFixedStore && canEdit && (
                <p
                  className="mt-1 text-[10px] uppercase tracking-[0.18em] text-[#2ECC71]"
                  style={{ fontFamily: "Arial, sans-serif" }}
                >
                  ✅ Venta activa
                </p>
              )}
            </div>
          </div>

          {/* Búsqueda */}
          <div>
            <p
              className="text-[10px] uppercase tracking-[0.22em] text-[#94A3B8] mb-[5px]"
              style={{ fontFamily: "Arial, sans-serif" }}
            >
              Búsqueda
            </p>
            <label
              className="rounded-[12px] border border-[#333333] bg-[#111111] px-3 py-2 flex flex-col justify-center"
              style={{ minHeight: SEARCH_BAR_HEIGHT_PX }}
            >
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Modelo, marca o talla"
                className="w-full border-none bg-transparent px-0 py-0 text-xs text-white placeholder:text-[#6B7280]"
                style={{ fontFamily: "Arial, sans-serif" }}
              />
            </label>
          </div>
        </div>
      </div>

      {/* Categorías */}
      <div className="border-b border-[#333333] px-[7px] py-[10px]">
        <div className="flex gap-[5px] overflow-x-auto whitespace-nowrap">
          {categoryOptions.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
              className={
                selectedCategory === category
                  ? "bt-button-primary shrink-0 px-3 py-1 text-[10px]"
                  : "bt-button-ghost shrink-0 px-3 py-1 text-[10px]"
              }
              style={{ fontFamily: "Arial, sans-serif" }}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de productos */}
      <div className="flex-1 overflow-y-auto p-4 !mt-[5px]">
        {isLoading ? (
          <div className="flex flex-wrap gap-3 ">
            {Array.from({ length: 12 }).map((_, index) => (
              <div
                key={index}
                className="animate-pulse rounded-[12px] border border-[#333333] bg-[#141414]"
                style={{ width: CARD_WIDTH_PX, height: 200 }}
              />
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div
            className="grid gap-[10px] p-1"
            style={{
              gridTemplateColumns: `repeat(auto-fill, minmax(${CARD_WIDTH_PX}px, 1fr))`,
            }}
          >
            {filteredProducts.map((product) => (
              <article
                key={product.id}
                className={`rounded-[12px] border bg-[#151515] p-[5px] flex flex-col transition-all hover:border-[#E8621A] hover:shadow-md ${
                  product.stock === 0
                    ? "border-[#333333] opacity-65"
                    : "border-[#333333]"
                }`}
              >
                <div className="w-full aspect-square mb-1 bg-[#0F0F0F] rounded-[8px] flex items-center justify-center text-3xl">
                  👟
                </div>
                <div className="flex-1 overflow-hidden">
                  <h3
                    className="text-xs font-bold text-white leading-tight line-clamp-2"
                    style={{ fontFamily: "Arial, sans-serif" }}
                  >
                    {product.name}
                  </h3>
                  <p
                    className="text-[10px] text-[#94A3B8] mt-0.5"
                    style={{ fontFamily: "Arial, sans-serif" }}
                  >
                    {product.brand} / {product.size}
                  </p>
                  <p className="font-mono text-xs font-bold text-[#2ECC71] mt-0.5">
                    {formatCurrency(product.price)}
                  </p>
                </div>
                <div className="mt-2">
                  {product.stock > 0 ? (
                    canEdit ? (
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
                        className="bt-button-primary w-full py-0.5 text-[9px] rounded-[8px]"
                        style={{ fontFamily: "Arial, sans-serif" }}
                      >
                        Agregar
                      </button>
                    ) : (
                      <div
                        className="w-full text-center text-[9px] uppercase tracking-[0.18em] text-[#6B7280]"
                        style={{ fontFamily: "Arial, sans-serif" }}
                      >
                        Solo consulta
                      </div>
                    )
                  ) : (
                    <div
                      className="w-full text-center text-[9px] uppercase tracking-[0.18em] text-[#E8621A]"
                      style={{ fontFamily: "Arial, sans-serif" }}
                    >
                      Agotado
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-[12px] border border-dashed border-[#333333] bg-[#141414] px-4 py-12 text-center">
            <p
              className="text-white"
              style={{ fontFamily: "Arial, sans-serif" }}
            >
              No hay productos
            </p>
            <p
              className="text-xs text-[#9CA3AF] mt-1"
              style={{ fontFamily: "Arial, sans-serif" }}
            >
              Ajusta los filtros
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
