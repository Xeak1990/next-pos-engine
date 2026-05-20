"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Product } from "../../types";
import ProductCard from "../../components/shop/ProductCard";
import FilterSidebar from "../../components/shop/FilterSidebar";

interface CatalogClientProps {
  initialProducts: Product[];
  filterOptions: {
    stores: string[];
    categories: string[];
    sizes: string[];
  };
}

interface FilterOptions {
  stores: string[];
  categories: string[];
  sizes: string[];
}

interface CatalogClientProps {
  initialProducts: Product[];
  filterOptions: FilterOptions;
}

function normalizeString(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

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
  });

  const filteredProducts = useMemo(() => {
    // Asegurar que initialProducts es un array
    if (!Array.isArray(initialProducts)) return [];

    return initialProducts.filter((product) => {
      if (!product) return false;

      // Filtro por categoría
      if (filters.category && product.category !== filters.category)
        return false;

      // Filtro por búsqueda
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

      // Verificar variantes
      const hasMatchingVariant = product.variants.some((variant) => {
        if (filters.size && variant.size !== filters.size) return false;
        if (filters.store) {
          const hasStore = variant.inventory.some(
            (inv) => inv.store.name === filters.store,
          );
          if (!hasStore) return false;
        }
        return true;
      });

      return matchesSearch && hasMatchingVariant;
    });
  }, [initialProducts, filters, searchQuery]);

  return (
    <div className="flex flex-col md:flex-row gap-8 overflow-y-visible">
      <aside className="md:w-72 shrink-0">
        <FilterSidebar
          options={filterOptions}
          filters={filters}
          onChange={setFilters}
        />
      </aside>
      <div className="flex-1 overflow-y-visible">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        {filteredProducts.length === 0 && (
          <div className="text-center py-12 text-[#9CA3AF]">
            No hay productos con los filtros seleccionados.
          </div>
        )}
      </div>
    </div>
  );
}
