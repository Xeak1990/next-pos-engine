"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Product } from "../../types";
import ProductCard from "../../components/shop/ProductCard";

interface CatalogClientProps {
  initialProducts: Product[];
  filterOptions: {
    stores: string[];
    categories: string[];
    sizes: string[];
  };
}

function normalizeString(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

const priceRanges = [
  { label: "Todos", min: 0, max: Infinity },
  { label: "Menos de $1,000", min: 0, max: 999 },
  { label: "$1,000 - $1,500", min: 1000, max: 1500 },
  { label: "$1,500 - $2,000", min: 1500, max: 2000 },
  { label: "$2,000 - $2,500", min: 2000, max: 2500 },
  { label: "$2,500 - $3,000", min: 2500, max: 3000 },
  { label: "Más de $3,000", min: 3000, max: Infinity },
];

export default function CatalogClient({
  initialProducts = [],
  filterOptions,
}: CatalogClientProps) {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("search") || "";

  const [filters, setFilters] = useState({
    store: "",
    category: "",
    size: "",
    priceRangeIndex: 0,
  });

  const filteredProducts = useMemo(() => {
    if (!Array.isArray(initialProducts)) return [];

    const priceRange = priceRanges[filters.priceRangeIndex];

    return initialProducts.filter((product) => {
      if (!product) return false;
      if (filters.category && product.category !== filters.category)
        return false;

      let matchesSearch = true;
      if (searchQuery) {
        const normalizedSearch = normalizeString(searchQuery);
        const productName = normalizeString(product.name || "");
        const productBrand = normalizeString(product.brand || "");
        const productCategory = normalizeString(product.category || "");
        const productColors = product.variants
          .map((v) => normalizeString(v.color || ""))
          .join(" ");
        matchesSearch =
          productName.includes(normalizedSearch) ||
          productBrand.includes(normalizedSearch) ||
          productCategory.includes(normalizedSearch) ||
          productColors.includes(normalizedSearch);
      }

      const hasMatchingVariant = product.variants.some((variant) => {
        if (filters.size && variant.size !== filters.size) return false;
        if (filters.store) {
          const hasStore = variant.inventory.some(
            (inv) => inv.store.name === filters.store,
          );
          if (!hasStore) return false;
        }
        const variantPrice = Number(variant.price);
        if (variantPrice < priceRange.min || variantPrice > priceRange.max)
          return false;
        return true;
      });

      return matchesSearch && hasMatchingVariant;
    });
  }, [initialProducts, filters, searchQuery]);

  const handleClearFilters = () => {
    setFilters({
      store: "",
      category: "",
      size: "",
      priceRangeIndex: 0,
    });
  };

  const currentDate = new Date();
  const formattedDate = new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
    .format(currentDate)
    .toLowerCase();

  return (
    <div className="w-full min-h-screen px-6 py-8 text-white overflow-y-visible">
      {/* Cabecera */}
      <div className="flex w-full items-start justify-between mb-[15px]">
        <div className="flex flex-col">
          <nav className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#666666]">
            <Link
              href="/dashboard"
              className="hover:text-white transition-colors duration-200"
            >
              Principal
            </Link>
            <span>/</span>
            <span className="text-[#e8621a]">Catálogo web</span>
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
            Catálogo web
          </h1>
          <p className="mt-[-8px] text-[16px] font-medium text-[#9CA3AF] lowercase opacity-80">
            {formattedDate}
          </p>
        </div>
      </div>

      {/* Contenido: filtros izquierda + productos derecha */}
      <div className="flex flex-row gap-[15px] items-start overflow-y-visible">
        {/* Panel de filtros con altura fija de 300px */}
        <aside className="w-[200px] shrink-0">
          <article className="bt-panel !rounded-[24px] flex flex-col shadow-[0_16px_45px_rgba(0,0,0,0.24)] p-3 h-[500px]">
            <div className="w-[80%] mx-auto pt-[10px] pb-[25px] flex flex-col h-full">
              <h2
                className="text-[15px] font-[900] uppercase text-white tracking-tight mb-[25px]"
                style={{
                  fontFamily: "Arial, sans-serif",
                  transform: "scale(0.9, 1.1)",
                  transformOrigin: "left center",
                  textShadow: "0 0 1px rgba(255,255,255,0.3)",
                }}
              >
                Filtros
              </h2>

              {/* Sucursal */}
              <div>
                <label className="block text-[12px] uppercase font-[900] text-[#9CA3AF] font-sans mb-[10px]">
                  Sucursal
                </label>
                <select
                  value={filters.store}
                  onChange={(e) =>
                    setFilters({ ...filters, store: e.target.value })
                  }
                  className="w-full rounded-[7px] border border-[#333333] bg-[#2A2A2A] text-white text-xs font-sans focus:outline-none focus:border-[#E8621A]"
                  style={{
                    height: "40px",
                    paddingLeft: "8px",
                    paddingRight: "8px",
                    marginBottom: "25px",
                  }} // ← separación extra de 25px
                >
                  <option value="">Todas</option>
                  {filterOptions.stores.map((store) => (
                    <option key={store} value={store}>
                      {store}
                    </option>
                  ))}
                </select>
              </div>

              {/* Categoría */}
              <div>
                <label className="block text-[12px] uppercase font-[900] text-[#9CA3AF] font-sans mb-[10px]">
                  Categoría
                </label>
                <select
                  value={filters.category}
                  onChange={(e) =>
                    setFilters({ ...filters, category: e.target.value })
                  }
                  className="w-full rounded-[7px] border border-[#333333] bg-[#2A2A2A] text-white text-xs font-sans focus:outline-none focus:border-[#E8621A]"
                  style={{
                    height: "40px",
                    paddingLeft: "8px",
                    paddingRight: "8px",
                    marginBottom: "25px",
                  }}
                >
                  <option value="">Todas</option>
                  {filterOptions.categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Talla */}
              <div>
                <label className="block text-[12px] uppercase font-[900] text-[#9CA3AF] font-sans mb-[10px]">
                  Talla
                </label>
                <div
                  className="flex flex-wrap gap-[5px]"
                  style={{ marginBottom: "25px" }}
                >
                  {filterOptions.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() =>
                        setFilters({
                          ...filters,
                          size: filters.size === size ? "" : size,
                        })
                      }
                      className={`px-3 py-1.5 text-xs font-semibold rounded-[14px] transition-all ${
                        filters.size === size
                          ? "bg-[#E8621A] text-white border border-[#E8621A]"
                          : "bg-[#111111] border border-[#2D2D2D] text-[#D1D5DB] hover:border-[#E8621A] hover:text-white"
                      }`}
                      style={{
                        fontFamily: "Arial, sans-serif",
                        borderRadius: "0.375rem",
                      }}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Precio */}
              <div>
                <label className="block text-[12px] uppercase font-[900] text-[#9CA3AF] font-sans mb-[10px]">
                  Precio
                </label>
                <select
                  value={filters.priceRangeIndex}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      priceRangeIndex: Number(e.target.value),
                    })
                  }
                  className="w-full rounded-[7px] border border-[#333333] bg-[#2A2A2A] text-white text-xs font-sans focus:outline-none focus:border-[#E8621A]"
                  style={{
                    height: "40px",
                    paddingLeft: "8px",
                    paddingRight: "8px",
                    marginBottom: "25px",
                  }}
                >
                  {priceRanges.map((range, idx) => (
                    <option key={idx} value={idx}>
                      {range.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Botón limpiar */}
              <button
                onClick={handleClearFilters}
                className="bt-button-ghost w-full font-[900] justify-center rounded-[8px] mt-auto text-[10px]"
                style={{
                  height: "24px",
                  fontFamily: "Arial, sans-serif",
                  fontWeight: 900,
                  padding: "0 0.5rem",
                  letterSpacing: "0.1em",
                }}
              >
                Limpiar filtros
              </button>
            </div>
          </article>
        </aside>

        {/* Grid de productos */}
        <div className="flex-1 overflow-y-visible">
          <div className="grid grid-cols-4 gap-[15px]">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          {filteredProducts.length === 0 && (
            <div className="text-center py-12 text-[#9CA3AF] font-sans text-sm">
              No hay productos con los filtros seleccionados.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
