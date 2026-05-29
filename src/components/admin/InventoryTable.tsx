"use client";

import { useEffect, useState, useTransition, useMemo } from "react";
import { createPortal } from "react-dom";
import { updateStock } from "../../actions/inventory";

interface InventoryItem {
  id: string;
  quantity: number;
  storeId: string;
  storeName: string;
  storeLocation: string;
  variant: {
    size: string;
    color: string;
    price: string;
    product: {
      name: string;
    };
  };
}

interface NewProductForm {
  name: string;
  brand: string;
  categoryId: string;
  color: string;
  size: string;
  price: string;
  stock: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

function ProductModal({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof document === "undefined") return;
    const { body, documentElement } = document;
    const previousBodyOverflow = body.style.overflow;
    const previousHtmlOverflow = documentElement.style.overflow;
    body.style.overflow = "hidden";
    documentElement.style.overflow = "hidden";
    return () => {
      body.style.overflow = previousBodyOverflow;
      documentElement.style.overflow = previousHtmlOverflow;
    };
  }, []);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      style={{ top: 0, right: 0, bottom: 0, left: 0 }}
    >
      {children}
    </div>,
    document.body
  );
}

export default function InventoryTable({ initialData }: { initialData: InventoryItem[] }) {
  const [inventory, setInventory] = useState(initialData);
  const [user, setUser] = useState<{ role: string; storeId: string | null } | null>(null);
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [newProduct, setNewProduct] = useState<NewProductForm>({
    name: "",
    brand: "",
    categoryId: "",
    color: "",
    size: "",
    price: "",
    stock: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [modalWidth, setModalWidth] = useState(700);
  const [modalHeight, setModalHeight] = useState(600);

  const stores = useMemo(() => {
    const storeMap = new Map<string, { id: string; name: string; location: string }>();
    for (const item of inventory) {
      if (!storeMap.has(item.storeId)) {
        storeMap.set(item.storeId, {
          id: item.storeId,
          name: item.storeName,
          location: item.storeLocation,
        });
      }
    }
    return Array.from(storeMap.values());
  }, [inventory]);

  // Efecto para cargar el usuario
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (!response.ok) return;
        const data = await response.json();
        const customer = data.customer;
        if (!customer) {
          console.error("No customer data in response");
          return;
        }
        const role = (customer.role || "").toUpperCase();
        setUser({ role, storeId: customer.storeId || null });

        if ((role === "MANAGER" || role === "CASHIER") && customer.storeId) {
          setSelectedStoreId(customer.storeId);
        } else if (stores.length > 0 && !selectedStoreId) {
          setSelectedStoreId(stores[0].id);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };
    fetchUser();
  }, [stores, selectedStoreId]); // ← agregada la dependencia faltante

  // Efecto para cargar categorías (sin función externa)
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await fetch("/api/categories");
        if (!res.ok) throw new Error("Error al cargar categorías");
        const data = await res.json();
        setCategories(data);
      } catch (error) {
        console.error(error);
      }
    };
    loadCategories();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const canModifyStock = user?.role === "ADMIN";
  const canAddProduct = user?.role === "ADMIN" || user?.role === "MANAGER";
  const canChangeBranch = user?.role === "ADMIN";

  const visibleInventory = inventory.filter((item) => {
    if (!canChangeBranch && user?.storeId) return item.storeId === user.storeId;
    return item.storeId === selectedStoreId;
  });

  const handleAdjust = (id: string, amount: number) => {
    if (!canModifyStock) return;
    const previousInventory = inventory;
    setInventory((current) =>
      current.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(0, item.quantity + amount) } : item
      )
    );
    startTransition(async () => {
      const result = await updateStock(id, amount);
      if (!result.success) {
        window.alert(result.error);
        setInventory(previousInventory);
      }
    });
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (
      !newProduct.name ||
      !newProduct.brand ||
      !newProduct.categoryId ||
      !newProduct.color ||
      !newProduct.size ||
      !newProduct.price ||
      !newProduct.stock
    ) {
      setErrorMessage("Todos los campos son obligatorios.");
      return;
    }
    let targetStoreId = selectedStoreId;
    if (!canChangeBranch && user?.storeId) targetStoreId = user.storeId;
    if (!targetStoreId) {
      setErrorMessage("No hay sucursal seleccionada.");
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newProduct.name,
          brand: newProduct.brand,
          categoryId: newProduct.categoryId,
          color: newProduct.color,
          size: newProduct.size,
          price: parseFloat(newProduct.price),
          stock: parseInt(newProduct.stock, 10),
          storeId: targetStoreId,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setErrorMessage(data.error || "Error al crear el producto");
        return;
      }
      window.location.reload();
    } catch (error) {
      console.error(error);
      setErrorMessage("Error de red");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      setErrorMessage("Ingrese un nombre para la categoría");
      return;
    }
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategoryName }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "Error al crear categoría");
        return;
      }
      // Recargar categorías
      const catRes = await fetch("/api/categories");
      const newCategories = await catRes.json();
      setCategories(newCategories);
      setIsCategoryModalOpen(false);
      setNewCategoryName("");
      // Seleccionar automáticamente la nueva categoría
      if (data.id) {
        setNewProduct((prev) => ({ ...prev, categoryId: data.id }));
      }
    } catch (error) {
      console.error(error);
      setErrorMessage("Error de red al crear categoría");
    }
  };

  const now = new Date();
  const formattedDate = new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
    .format(now)
    .toLowerCase();

  return (
    <div className="w-full min-h-screen bg-[#060606] px-6 py-8 text-white overflow-y-visible">
      {/* Cabecera */}
      <div className="flex w-full items-start justify-between mb-[15px]">
        <div className="flex flex-col">
          <nav className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#666666]">
            <span className="hover:text-white transition-colors duration-200 cursor-default">Operaciones</span>
            <span>/</span>
            <span className="text-[#e8621a]">Inventario</span>
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
            Inventario
          </h1>
          <p className="mt-[-8px] text-[16px] font-medium text-[#9CA3AF] opacity-80">Stock por sucursal</p>
          <p className="mt-[-8px] text-[16px] font-medium text-[#9CA3AF] lowercase opacity-80">{formattedDate}</p>
        </div>
        {canAddProduct && (
          <button
            onClick={() => setIsProductModalOpen(true)}
            className="bt-button-primary px-6 py-2 text-xs whitespace-nowrap"
            style={{ fontFamily: "Arial, sans-serif", padding: "7px 12px !important", minHeight: "auto !important" }}
          >
            + Nuevo Producto
          </button>
        )}
      </div>

      {/* Botones de sucursal */}
      <div className="mb-[10px]">
        <div className="flex flex-wrap gap-[10px]">
          {stores.map((store) => {
            const isActive = selectedStoreId === store.id;
            let disabled = false;
            if (!canChangeBranch && user?.storeId) disabled = store.id !== user.storeId;
            return (
              <button
                key={store.id}
                type="button"
                onClick={() => setSelectedStoreId(store.id)}
                disabled={disabled}
                className={`px-4 py-[10px] text-xs font-[600] uppercase tracking-[0.18em] rounded-[7px] transition-all ${
                  isActive
                    ? "bg-[#E8621A] text-white border border-[#E8621A] shadow-md"
                    : "bg-[#2A2A2A] text-white border border-transparent hover:bg-[#2C2C2C] disabled:opacity-50 disabled:cursor-not-allowed"
                }`}
                style={{ color: "#FFFFFF", fontFamily: "Arial, sans-serif" }}
              >
                {store.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Paneles informativos */}
      <div className="flex flex-wrap gap-[10px] mb-[10px]">
        <div className="bt-panel-blue rounded-[12px] px-5 py-4 flex-1 min-w-[180px]">
          <p className="text-xs uppercase tracking-[0.3em] text-[#C9D8EA] font-semibold">Variantes activas</p>
          <p className="mt-2 font-mono text-2xl font-bold text-white">{inventory.length}</p>
        </div>
        <div className="rounded-[14px] border border-[#333333] bg-[#111111] px-5 py-4 flex-1 min-w-[180px]">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#94A3B8] font-semibold">Registros visibles</p>
          <p className="mt-2 font-mono text-2xl font-bold text-white">{visibleInventory.length}</p>
        </div>
      </div>

      {/* Tabla de inventario */}
      <div className="bt-panel rounded-[24px] shadow-[0_16px_45px_rgba(0,0,0,0.24)] p-5">
        <div className="bt-table-shell rounded-[24px] overflow-hidden border border-[#2A2A2A]">
          <div className="custom-scrollbar overflow-x-auto">
            <table className="bt-table min-w-[760px] table-fixed w-full">
              <colgroup>
                <col className="w-[44%]" />
                <col className="w-[18%]" />
                <col className="w-[18%]" />
                <col className="w-[20%]" />
              </colgroup>
              <thead className="bg-[#1A1A1A]">
                <tr>
                  <th className="text-left text-[11px] font-bold uppercase tracking-[0.22em] text-[#9CA3AF]">Producto</th>
                  <th className="text-left text-[11px] font-bold uppercase tracking-[0.22em] text-[#9CA3AF]">Talla</th>
                  <th className="text-left text-[11px] font-bold uppercase tracking-[0.22em] text-[#9CA3AF]">Stock</th>
                  <th className="text-right text-[11px] font-bold uppercase tracking-[0.22em] text-[#9CA3AF]">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {visibleInventory.map((item) => (
                  <tr key={item.id} className="border-t border-[#222222] hover:bg-[#1A1A1A]/40 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-semibold text-white font-sans">{item.variant.product.name}</p>
                        <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-[#94A3B8]">{item.variant.color}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-sm text-white">{item.variant.size}</td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-block !rounded-[12px] px-3 py-1 font-mono text-xs font-semibold bg-[#2ECC71]/15 text-[#2ECC71]"
                        style={{
                          borderRadius: "9999px",
                          backgroundColor: "#1E2A1C",
                          padding: "6px 12px",
                          fontSize: "12px",
                          fontWeight: "bold",
                          textTransform: "uppercase",
                          letterSpacing: "0.2em",
                          color: "#2ECC71",
                          lineHeight: "1",
                          boxShadow: "inset 0 1px 1px rgba(255,255,255,0.05), 0 2px 4px rgba(0,0,0,0.2)",
                        }}
                      >
                        {item.quantity} uds
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-[5px]">
                        {canModifyStock ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleAdjust(item.id, -1)}
                              className="inline-flex items-center justify-center w-[30px] h-[30px] text-xs font-semibold rounded-[5px] border-none bg-[#2A2A2A] text-white hover:bg-[#3A3A3A]"
                              style={{ color: "#FFFFFF", fontFamily: "Arial, sans-serif" }}
                            >
                              -1
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAdjust(item.id, 1)}
                              className="inline-flex items-center justify-center w-[30px] h-[30px] text-xs font-bold uppercase tracking-[0.12em] rounded-[5px] border-none bg-[#E8621A] text-white hover:bg-[#f07330] transition-colors"
                              style={{ color: "#FFFFFF", fontFamily: "Arial, sans-serif" }}
                            >
                              +1
                            </button>
                          </>
                        ) : (
                          <span className="px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-[#6B7280] font-medium">Solo consulta</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {visibleInventory.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-14 text-center text-sm text-[#9CA3AF] font-sans">
                      No hay existencias para la sucursal seleccionada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        {isPending && (
          <div className="mt-4 rounded-[14px] border border-[#333333] bg-[#111111] px-5 py-3 text-xs uppercase tracking-[0.24em] text-[#94A3B8] text-center">
            Sincronizando inventario...
          </div>
        )}
      </div>

      {/* Modal de nuevo producto */}
      {isProductModalOpen && (
        <ProductModal>
          <div
            role="dialog"
            aria-modal="true"
            className="custom-scrollbar overflow-y-auto rounded-[24px] bg-[#1A1A1A] shadow-xl border border-gray-600"
            style={{ width: `${modalWidth}px`, maxWidth: "90vw", height: `${modalHeight}px`, maxHeight: "90vh" }}
          >
            <div className="w-[88%] mx-auto py-6 space-y-[10px]">
              {/* Cabecera con controles de tamaño */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-[#94A3B8]" style={{ fontFamily: "Arial, sans-serif" }}>
                    Nuevo producto
                  </p>
                  <h2 className="mt-1 text-4xl text-white" style={{ fontFamily: "Arial, sans-serif" }}>
                    Crear Variante
                  </h2>
                  <p className="mt-1 text-sm text-[#9CA3AF]" style={{ fontFamily: "Arial, sans-serif" }}>
                    Completa los datos para agregar una nueva variante de producto.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex items-center gap-2 bg-black/40 rounded-full px-3 py-1">
                    <span className="text-[10px] text-gray-400">Ancho:</span>
                    <input
                      type="range"
                      min="500"
                      max="1200"
                      step="10"
                      value={modalWidth}
                      onChange={(e) => setModalWidth(Number(e.target.value))}
                      className="w-24 h-1 accent-[#E8621A]"
                    />
                    <span className="text-xs text-white">{modalWidth}px</span>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 bg-black/40 rounded-full px-3 py-1">
                    <span className="text-[10px] text-gray-400">Alto:</span>
                    <input
                      type="range"
                      min="500"
                      max="800"
                      step="10"
                      value={modalHeight}
                      onChange={(e) => setModalHeight(Number(e.target.value))}
                      className="w-24 h-1 accent-[#E8621A]"
                    />
                    <span className="text-xs text-white">{modalHeight}px</span>
                  </div>
                  <button onClick={() => setIsProductModalOpen(false)} className="bt-button-ghost px-4 py-2 text-xs">
                    Cerrar
                  </button>
                </div>
              </div>

              {/* Formulario */}
              <form className="space-y-[10px]" onSubmit={handleCreateProduct}>
                {errorMessage && (
                  <div className="rounded-[12px] border border-[#E8621A]/30 bg-[#E8621A]/10 px-4 py-3 text-sm text-[#FED7AA]">
                    {errorMessage}
                  </div>
                )}

                <div className="grid gap-[10px] md:grid-cols-2">
                  <label className="space-y-[5px] text-sm text-[#D1D5DB]">
                    <span>Nombre del producto</span>
                    <input
                      type="text"
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                      className="bt-input w-full px-4 py-3"
                      required
                    />
                  </label>
                  <label className="space-y-[5px] text-sm text-[#D1D5DB]">
                    <span>Marca</span>
                    <input
                      type="text"
                      value={newProduct.brand}
                      onChange={(e) => setNewProduct({ ...newProduct, brand: e.target.value })}
                      className="bt-input w-full px-4 py-3"
                      required
                    />
                  </label>
                </div>

                <div className="grid gap-[10px] md:grid-cols-2">
                  <div className="space-y-[5px] text-sm text-[#D1D5DB]">
                    <div className="flex justify-between items-center">
                      <span>Categoría</span>
                      <button
                        type="button"
                        onClick={() => setIsCategoryModalOpen(true)}
                        className="text-xs text-[#E8621A] hover:underline"
                      >
                        + Nueva
                      </button>
                    </div>
                    <select
                      value={newProduct.categoryId}
                      onChange={(e) => setNewProduct({ ...newProduct, categoryId: e.target.value })}
                      className="bt-input w-full px-4 py-3"
                      required
                    >
                      <option value="">Selecciona una categoría</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <label className="space-y-[5px] text-sm text-[#D1D5DB]">
                    <span>Color</span>
                    <input
                      type="text"
                      value={newProduct.color}
                      onChange={(e) => setNewProduct({ ...newProduct, color: e.target.value })}
                      className="bt-input w-full px-4 py-3"
                      required
                    />
                  </label>
                </div>

                <div className="grid gap-[10px] md:grid-cols-2">
                  <label className="space-y-[5px] text-sm text-[#D1D5DB]">
                    <span>Talla</span>
                    <input
                      type="text"
                      value={newProduct.size}
                      onChange={(e) => setNewProduct({ ...newProduct, size: e.target.value })}
                      className="bt-input w-full px-4 py-3"
                      required
                    />
                  </label>
                  <label className="space-y-[5px] text-sm text-[#D1D5DB]">
                    <span>Precio ($)</span>
                    <input
                      type="number"
                      step="0.01"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                      className="bt-input w-full px-4 py-3"
                      required
                    />
                  </label>
                </div>

                <div className="grid gap-[10px] md:grid-cols-2">
                  <label className="space-y-[5px] text-sm text-[#D1D5DB]">
                    <span>Stock inicial</span>
                    <input
                      type="number"
                      min="0"
                      value={newProduct.stock}
                      onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                      className="bt-input w-full px-4 py-3"
                      required
                    />
                  </label>
                  {!canChangeBranch && user?.storeId && (
                    <div className="space-y-[5px] text-sm text-[#D1D5DB]">
                      <span>Sucursal</span>
                      <input
                        type="text"
                        value={stores.find((s) => s.id === user.storeId)?.name || ""}
                        disabled
                        className="bt-input w-full px-4 py-3 opacity-70 cursor-not-allowed"
                      />
                    </div>
                  )}
                  {canChangeBranch && (
                    <label className="space-y-[5px] text-sm text-[#D1D5DB]">
                      <span>Sucursal</span>
                      <select
                        value={selectedStoreId}
                        onChange={(e) => setSelectedStoreId(e.target.value)}
                        className="bt-input w-full px-4 py-3"
                        required
                      >
                        {stores.map((store) => (
                          <option key={store.id} value={store.id}>
                            {store.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                </div>

                <div className="flex flex-col gap-[10px] pt-4 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setIsProductModalOpen(false)}
                    className="bt-button-ghost px-6 py-3 text-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bt-button-primary px-6 py-3 text-xs disabled:opacity-60"
                  >
                    {isSubmitting ? "Guardando..." : "Crear Producto"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ProductModal>
      )}

      {/* Modal para crear nueva categoría */}
      {isCategoryModalOpen && (
        <ProductModal>
          <div className="bg-[#1A1A1A] rounded-[24px] shadow-xl border border-gray-600 w-[400px] max-w-[90vw] p-6">
            <h3 className="text-xl text-white mb-2">Nueva Categoría</h3>
            <p className="text-sm text-[#9CA3AF] mb-4">Ingresa el nombre de la nueva categoría</p>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="bt-input w-full px-4 py-3 mb-4"
              placeholder="Ej: Deportivo"
              autoFocus
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setIsCategoryModalOpen(false)} className="bt-button-ghost px-4 py-2 text-xs">
                Cancelar
              </button>
              <button onClick={handleCreateCategory} className="bt-button-primary px-4 py-2 text-xs">
                Crear Categoría
              </button>
            </div>
          </div>
        </ProductModal>
      )}
    </div>
  );
}