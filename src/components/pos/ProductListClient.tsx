"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { formatCurrency } from "../../lib/utils";
import { useCart } from "../../lib/CartContext";
import ProductSizeModal from "./ProductSizeModal";

export interface PosProduct {
  id: string;
  name: string;
  brand: string;
  category: string;
  color: string;
  size: string;
  price: string;
  stock: number;
  storeName: string;
}

interface GroupedProduct {
  name: string;
  brand: string;
  variants: {
    id: string;
    size: string;
    color: string;
    stock: number;
    price: number;
  }[];
  minPrice: number;
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
  const [selectedStore, setSelectedStore] = useState(initialStoreLocation ?? "");
  const [userRole, setUserRole] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<GroupedProduct | null>(null);
  const [storeDropdownOpen, setStoreDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { addItem } = useCart();

  // ============================================================
  // AJUSTES PERSONALIZABLES (ancho y altura en píxeles)
  // ============================================================
  const CARD_WIDTH_PX = 220;
  const STORE_SELECTOR_WIDTH_PX = 200;
  const STORE_SELECTOR_HEIGHT_PX = 65;
  const SEARCH_BAR_HEIGHT_PX = 40;
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

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setStoreDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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

  const groupedProducts = useMemo(() => {
    const groups = new Map<string, GroupedProduct>();
    for (const p of filteredProducts) {
      const key = p.name;
      if (!groups.has(key)) {
        groups.set(key, {
          name: p.name,
          brand: p.brand,
          variants: [],
          minPrice: Infinity,
        });
      }
      const group = groups.get(key)!;
      const priceNum = Number(p.price);
      group.variants.push({
        id: p.id,
        size: p.size,
        color: p.color,
        stock: p.stock,
        price: priceNum,
      });
      if (priceNum < group.minPrice) group.minPrice = priceNum;
    }
    return Array.from(groups.values());
  }, [filteredProducts]);

  const handleOpenModal = (group: GroupedProduct) => {
    setSelectedGroup(group);
  };

  const handleAddToCart = (variantId: string, size: string, price: number, stock: number) => {
    const product = filteredProducts.find(p => p.id === variantId);
    if (!product) return;
    addItem(
      {
        variantId: product.id,
        name: product.name,
        size: product.size,
        price: price,
        quantity: 1,
        stockAvailable: stock,
      },
      stock,
    );
  };

  return (
    <section className="flex h-full flex-col">
      {/* Cabecera */}
      <div className="border-b border-[#333333] px-4 py-3">
        <nav className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#666666]">
          <Link href="/dashboard" className="hover:text-white transition-colors duration-200">
            Principal
          </Link>
          <span>/</span>
          <span className="text-[#e8621a]">Punto de venta</span>
        </nav>
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
        <p className="mt-[-8px] text-[16px] font-medium text-[#9CA3AF] lowercase opacity-80">
          {formatLowercaseDate(now)}
        </p>

        {/* Sucursal y búsqueda */}
        <div
          className="mt-4 mb-[15px] grid gap-[15px]"
          style={{ gridTemplateColumns: `${STORE_SELECTOR_WIDTH_PX}px 1fr` }}
        >
          {/* Sucursal */}
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-[#94A3B8] mb-[5px]" style={{ fontFamily: "Arial, sans-serif" }}>
              Sucursal
            </p>
            <div ref={dropdownRef} className="relative">
              <button
                type="button"
                onClick={() => canChangeBranch && setStoreDropdownOpen(!storeDropdownOpen)}
                disabled={!canChangeBranch}
                style={{
                  width: "100%",
                  borderRadius: "12px",
                  border: "1px solid #333333",
                  backgroundColor: "#111111",
                  color: "#E8621A",
                  textAlign: "left",
                  fontSize: "0.75rem",
                  fontWeight: "600",
                  padding: "12px 12px",
                  minHeight: `${STORE_SELECTOR_HEIGHT_PX}px`,
                  fontFamily: "Arial, sans-serif",
                  cursor: canChangeBranch ? "pointer" : "not-allowed",
                  opacity: canChangeBranch ? 1 : 0.6,
                  outline: "none",
                }}
              >
                {activeStore || "Seleccionar sucursal"}
              </button>
              {storeDropdownOpen && canChangeBranch && (
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: "100%",
                    marginTop: "4px",
                    zIndex: 10,
                    backgroundColor: "#1A1A1A",
                    border: "1px solid #333333",
                    borderRadius: "8px",
                    boxShadow: "0 10px 15px -3px rgba(0,0,0,0.3)",
                    maxHeight: "240px",
                    overflowY: "auto",
                  }}
                >
                  {storeOptions.map((store) => (
                    <button
                      key={store}
                      type="button"
                      onClick={() => {
                        setSelectedStore(store);
                        setStoreDropdownOpen(false);
                      }}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "8px 16px",
                        fontSize: "0.75rem",
                        fontFamily: "Arial, sans-serif",
                        backgroundColor: "#1A1A1A",
                        color: "#FFFFFF",
                        border: "none",
                        cursor: "pointer",
                        transition: "background-color 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#2A2A2A";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "#1A1A1A";
                      }}
                    >
                      {store}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {hasFixedStore && !canEdit && (
              <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-[#E8621A]" style={{ fontFamily: "Arial, sans-serif" }}>
                ⚠️ Consulta
              </p>
            )}
            {hasFixedStore && canEdit && (
              <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-[#2ECC71]" style={{ fontFamily: "Arial, sans-serif" }}>
                ✅ Venta activa
              </p>
            )}
          </div>

          {/* Búsqueda - input directo con tamaño original */}
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-[#94A3B8] mb-[5px]" style={{ fontFamily: "Arial, sans-serif" }}>
              Búsqueda
            </p>
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Modelo, marca o talla"
              style={{
                width: "100%",
                borderRadius: "12px",
                border: "1px solid #333333",
                backgroundColor: "#111111",
                padding: "10px 12px", // tamaño original
                fontSize: "0.75rem",
                fontFamily: "Arial, sans-serif",
                color: "#FFFFFF",
                outline: "none",
                minHeight: `${SEARCH_BAR_HEIGHT_PX}px`,
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#E8621A")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#333333")}
            />
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
          <div className="flex flex-wrap gap-3">
            {Array.from({ length: 12 }).map((_, index) => (
              <div
                key={index}
                className="animate-pulse rounded-[12px] border border-[#333333] bg-[#141414]"
                style={{ width: CARD_WIDTH_PX, height: 200 }}
              />
            ))}
          </div>
        ) : groupedProducts.length > 0 ? (
          <div
            className="grid gap-[10px] p-1"
            style={{
              gridTemplateColumns: `repeat(auto-fill, minmax(${CARD_WIDTH_PX}px, 1fr))`,
            }}
          >
            {groupedProducts.map((group) => (
              <article
                key={group.name}
                className={`rounded-[12px] border bg-[#151515] p-[5px] flex flex-col transition-all hover:border-[#E8621A] hover:shadow-md ${
                  group.variants.every(v => v.stock === 0) ? "border-[#333333] opacity-65" : "border-[#333333]"
                }`}
              >
                <div className="w-full aspect-square mb-1 bg-[#0F0F0F] rounded-[8px] flex items-center justify-center text-3xl">👟</div>
                <div className="flex-1 overflow-hidden">
                  <h3 className="text-xs font-bold text-white leading-tight line-clamp-2" style={{ fontFamily: "Arial, sans-serif" }}>{group.name}</h3>
                  <p className="text-[10px] text-[#94A3B8] mt-0.5" style={{ fontFamily: "Arial, sans-serif" }}>{group.brand} / {group.variants.length} tallas</p>
                  <p className="font-mono text-xs font-bold text-[#2ECC71] mt-0.5">{formatCurrency(group.minPrice)}</p>
                </div>
                <div className="mt-2">
                  {group.variants.some(v => v.stock > 0) ? (
                    canEdit ? (
                      <button type="button" onClick={() => handleOpenModal(group)} className="bt-button-primary w-full py-0.5 text-[9px] rounded-[8px]" style={{ fontFamily: "Arial, sans-serif" }}>Seleccionar talla</button>
                    ) : (
                      <div className="w-full text-center text-[9px] uppercase tracking-[0.18em] text-[#6B7280]" style={{ fontFamily: "Arial, sans-serif" }}>Solo consulta</div>
                    )
                  ) : (
                    <div className="w-full text-center text-[9px] uppercase tracking-[0.18em] text-[#E8621A]" style={{ fontFamily: "Arial, sans-serif" }}>Agotado</div>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-[12px] border border-dashed border-[#333333] bg-[#141414] px-4 py-12 text-center">
            <p className="text-white" style={{ fontFamily: "Arial, sans-serif" }}>No hay productos</p>
            <p className="text-xs text-[#9CA3AF] mt-1" style={{ fontFamily: "Arial, sans-serif" }}>Ajusta los filtros</p>
          </div>
        )}
      </div>

      {/* Modal de selección de talla */}
      {selectedGroup && (
        <ProductSizeModal
          isOpen={true}
          onClose={() => setSelectedGroup(null)}
          productName={selectedGroup.name}
          variants={selectedGroup.variants}
          onAddToCart={handleAddToCart}
          canEdit={canEdit}
        />
      )}
    </section>
  );
}