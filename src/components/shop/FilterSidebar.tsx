"use client";

function formatCategory(cat: string): string {
  if (!cat) return "";
  return cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase();
}

interface FilterOptions {
  stores: string[];
  categories: string[];
  sizes: string[];
}

interface Filters {
  store: string;
  category: string;
  size: string;
}

interface FilterSidebarProps {
  options: FilterOptions;
  filters: Filters;
  onChange: (newFilters: Filters) => void;
}

export default function FilterSidebar({ options = { stores: [], categories: [], sizes: [] }, filters, onChange }: FilterSidebarProps) {
  const updateFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    onChange({ ...filters, [key]: value });
  };

  const formattedCategories = options.categories.map(formatCategory);
  const categoryMap = new Map(formattedCategories.map((f, i) => [f, options.categories[i]]));

  return (
    <div className="bt-panel rounded-2xl p-5 space-y-6">
      <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#9CA3AF] mb-4">Filtros</h3>

      <div>
        <label className="block text-xs uppercase tracking-[0.2em] text-[#94A3B8] mb-2">Sucursal</label>
        <select
          value={filters.store}
          onChange={(e) => updateFilter("store", e.target.value)}
          className="w-full rounded-lg border border-[#333] bg-[#111] p-2 text-white text-sm"
        >
          <option value="">Todas las sucursales</option>
          {options.stores.map((store) => (
            <option key={store} value={store}>{store}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs uppercase tracking-[0.2em] text-[#94A3B8] mb-2">Categoría</label>
        <select
          value={filters.category}
          onChange={(e) => {
            const selectedDisplay = e.target.value;
            const originalCat = categoryMap.get(selectedDisplay) || "";
            updateFilter("category", originalCat);
          }}
          className="w-full rounded-lg border border-[#333] bg-[#111] p-2 text-white text-sm"
        >
          <option value="">Todas</option>
          {formattedCategories.map((displayCat) => (
            <option key={displayCat} value={displayCat}>{displayCat}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs uppercase tracking-[0.2em] text-[#94A3B8] mb-2">Talla</label>
        <select
          value={filters.size}
          onChange={(e) => updateFilter("size", e.target.value)}
          className="w-full rounded-lg border border-[#333] bg-[#111] p-2 text-white text-sm"
        >
          <option value="">Todas las tallas</option>
          {options.sizes.map((size) => (
            <option key={size} value={size}>{size}</option>
          ))}
        </select>
      </div>

      <button
        onClick={() => onChange({ store: "", category: "", size: "" })}
        className="w-full rounded-full border border-[#333] bg-[#111] py-2 text-xs font-semibold text-[#D1D5DB] hover:border-[#E8621A] hover:text-white transition"
      >
        Limpiar filtros
      </button>
    </div>
  );
}