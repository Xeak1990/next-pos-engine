"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Product } from "../../types";
import ProductCard from "../../components/shop/ProductCard";
import CartIcon from "../../components/shop/CartIcon";
import { useCartWeb } from "../../context/CartContextWeb";

interface CatalogClientProps {
  initialProducts: Product[];
  filterOptions: {
    stores: string[];
    categories: string[];
    sizes: string[];
  };
}

const PROFILE_ICON_SIZE_PX = 26;

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
  const router = useRouter();
  const pathname = usePathname();
  const { clearCart } = useCartWeb();
  const [filters, setFilters] = useState({
    store: "",
    category: "",
    size: "",
    priceRangeIndex: 0,
  });

  const [customer, setCustomer] = useState<{ name: string } | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchCustomer = async () => {
      try {
        const res = await fetch("/api/auth/customer/me", {
          cache: "no-store",
          credentials: "include",
        });
        if (res.ok && isMounted) {
          const data = await res.json();
          setCustomer(data || null);
        } else if (isMounted) {
          setCustomer(null);
        }
      } catch {
        if (isMounted) setCustomer(null);
      }
    };
    fetchCustomer();
    return () => {
      isMounted = false;
    };
  }, [pathname]);

  const handleLogout = async () => {
    await fetch("/api/auth/customer/logout", { method: "POST", credentials: "include" });
    clearCart();
    setCustomer(null);
    router.push("/");
  };

  const filteredProducts = useMemo(() => {
    if (!Array.isArray(initialProducts)) return [];
    const priceRange = priceRanges[filters.priceRangeIndex];
    return initialProducts.filter((product) => {
      if (!product) return false;
      if (filters.category && product.category !== filters.category) return false;

      const hasMatchingVariant = product.variants.some((variant) => {
        if (filters.size && variant.size !== filters.size) return false;
        if (filters.store) {
          const hasStore = variant.inventory.some(
            (inv) => inv.store.name === filters.store
          );
          if (!hasStore) return false;
        }
        const variantPrice = Number(variant.price);
        if (variantPrice < priceRange.min || variantPrice > priceRange.max)
          return false;
        return true;
      });
      return hasMatchingVariant;
    });
  }, [initialProducts, filters]);

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
    <div className="min-h-screen w-full flex flex-col px-6 py-8 text-white">
      {/* Cabecera fija */}
      <div className="flex w-full items-start justify-between mb-[15px] shrink-0">
        <div className="flex flex-col">
          <nav className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#666666]">
            <Link href="/dashboard" className="hover:text-white transition-colors duration-200">
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

        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center justify-center rounded-full border-0 ring-0 text-white transition-colors hover:text-[#E8621A] focus:outline-none focus:ring-0"
              style={{ width: PROFILE_ICON_SIZE_PX + 8, height: PROFILE_ICON_SIZE_PX + 8 }}
              aria-label="Menú de usuario"
            >
              {customer ? (
                <span className="uppercase text-base font-bold text-[#9CA3AF]">
                  {customer.name?.charAt(0) || "U"}
                </span>
              ) : (
                <svg
                  width={PROFILE_ICON_SIZE_PX}
                  height={PROFILE_ICON_SIZE_PX}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#9CA3AF"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              )}
            </button>
            {dropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                {/* ========== LÍNEA PARA MODIFICAR EL ANCHO DEL MENÚ ========== */}
                {/* Cambia "w-40" por el ancho que quieras (ej: w-36, w-44, w-32) */}
                <div
                  className="absolute left-1/2 -translate-x-1/2 mt-2 w-40 rounded-[12px] border border-[#333] bg-[#1A1A1A] shadow-xl z-50 overflow-hidden"
                  style={{ fontFamily: "Arial, sans-serif" }}
                >
                  {customer ? (
                    <>
                      <div className="px-3 py-2 text-sm text-white border-b border-[#333] bg-[#111111]">
                        <p className="font-semibold">Hola, {customer.name?.split(" ")[0] || "Usuario"}</p>
                      </div>
                      <Link
                        href="/account"
                        className="block px-3 py-2 text-sm text-[#D1D5DB] hover:bg-[#2A2A2A] hover:text-white transition-colors"
                        onClick={() => setDropdownOpen(false)}
                        style={{ fontFamily: "Arial, sans-serif" }}
                      >
                        Mi cuenta
                      </Link>
                      <Link
                        href="/orders/history"
                        className="block px-3 py-2 text-sm text-[#D1D5DB] hover:bg-[#2A2A2A] hover:text-white transition-colors"
                        onClick={() => setDropdownOpen(false)}
                        style={{ fontFamily: "Arial, sans-serif" }}
                      >
                        Mis pedidos
                      </Link>
                      <div className="px-2 pb-2">
                        {/* ========== LÍNEA PARA MODIFICAR EL TAMAÑO DEL TEXTO DEL BOTÓN ========== */}
                        {/* Cambia "text-xs" por "text-sm", "text-[10px]", etc. */}
                        <button
                          onClick={() => {
                            handleLogout();
                            setDropdownOpen(false);
                          }}
                          className="bt-button-ghost w-full justify-center text-[12px] tracking-wider font-semibold"
                          style={{ fontFamily: "Arial, sans-serif", padding: "0.5rem 0" }}
                        >
                          Cerrar sesión
                        </button>
                      </div>
                    </>
                  ) : (
                    <Link
                      href="/login"
                      className="block px-3 py-2 text-sm text-[#D1D5DB] hover:bg-[#2A2A2A] hover:text-white transition-colors text-center"
                      onClick={() => setDropdownOpen(false)}
                      style={{ fontFamily: "Arial, sans-serif" }}
                    >
                      Iniciar sesión
                    </Link>
                  )}
                </div>
              </>
            )}
          </div>
          <CartIcon />
        </div>
      </div>

      {/* Fila principal: filtros + productos (sin cambios) */}
      <div className="flex-1 flex flex-row gap-[15px] items-start">
        <aside className="w-[200px] shrink-0">
          <article className="bt-panel !rounded-[24px] flex flex-col shadow-[0_16px_45px_rgba(0,0,0,0.24)] p-3 h-[500px] overflow-y-auto">
            <div className="w-[80%] mx-auto pt-[10px] pb-[25px] flex flex-col h-full">
              <h2 className="text-[15px] font-[900] uppercase text-white tracking-tight mb-[25px]" style={{ fontFamily: "Arial, sans-serif", transform: "scale(0.9, 1.1)", transformOrigin: "left center", textShadow: "0 0 1px rgba(255,255,255,0.3)" }}>
                Filtros
              </h2>
              {/* Sucursal */}
              <div>
                <label className="block text-[12px] uppercase font-[900] text-[#9CA3AF] font-sans mb-[10px]">Sucursal</label>
                <select
                  value={filters.store}
                  onChange={(e) => setFilters({ ...filters, store: e.target.value })}
                  className="w-full rounded-[7px] border border-[#333333] bg-[#2A2A2A] text-white text-xs font-sans focus:outline-none focus:border-[#E8621A]"
                  style={{ height: "40px", paddingLeft: "8px", paddingRight: "8px", marginBottom: "25px" }}
                >
                  <option value="">Todas</option>
                  {filterOptions.stores.map((store) => (
                    <option key={store} value={store}>{store}</option>
                  ))}
                </select>
              </div>
              {/* Categoría */}
              <div>
                <label className="block text-[12px] uppercase font-[900] text-[#9CA3AF] font-sans mb-[10px]">Categoría</label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                  className="w-full rounded-[7px] border border-[#333333] bg-[#2A2A2A] text-white text-xs font-sans focus:outline-none focus:border-[#E8621A]"
                  style={{ height: "40px", paddingLeft: "8px", paddingRight: "8px", marginBottom: "25px" }}
                >
                  <option value="">Todas</option>
                  {filterOptions.categories.map((cat, idx) => (
                    <option key={`cat-${idx}`} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              {/* Talla */}
              <div>
                <label className="block text-[12px] uppercase font-[900] text-[#9CA3AF] font-sans mb-[10px]">Talla</label>
                <div className="flex flex-wrap gap-[5px]" style={{ marginBottom: "25px" }}>
                  {filterOptions.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setFilters({ ...filters, size: filters.size === size ? "" : size })}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-[14px] transition-all ${
                        filters.size === size
                          ? "bg-[#E8621A] text-white border border-[#E8621A]"
                          : "bg-[#111111] border border-[#2D2D2D] text-[#D1D5DB] hover:border-[#E8621A] hover:text-white"
                      }`}
                      style={{ fontFamily: "Arial, sans-serif", borderRadius: "0.375rem" }}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
              {/* Precio */}
              <div>
                <label className="block text-[12px] uppercase font-[900] text-[#9CA3AF] font-sans mb-[10px]">Precio</label>
                <select
                  value={filters.priceRangeIndex}
                  onChange={(e) => setFilters({ ...filters, priceRangeIndex: Number(e.target.value) })}
                  className="w-full rounded-[7px] border border-[#333333] bg-[#2A2A2A] text-white text-xs font-sans focus:outline-none focus:border-[#E8621A]"
                  style={{ height: "40px", paddingLeft: "8px", paddingRight: "8px", marginBottom: "25px" }}
                >
                  {priceRanges.map((range, idx) => (
                    <option key={idx} value={idx}>{range.label}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleClearFilters}
                className="bt-button-ghost w-full font-[900] justify-center rounded-[8px] mt-auto text-[10px]"
                style={{ height: "24px", fontFamily: "Arial, sans-serif", fontWeight: 900, padding: "0 0.5rem", letterSpacing: "0.1em" }}
              >
                Limpiar filtros
              </button>
            </div>
          </article>
        </aside>

        <div className="flex-1 min-w-0 flex flex-col">
          <div className="grid grid-cols-4 gap-[15px] auto-rows-min">
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