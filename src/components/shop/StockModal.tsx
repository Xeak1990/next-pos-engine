"use client";

import { useState } from "react";
import { formatCurrency } from "../../lib/utils";

interface StockModalProps {
  productName: string;
  price: string;
  variants: Array<{
    id: string;
    size: string;
    color: string;
    inventory: Array<{ quantity: number; store: { id: string; name: string } }>;
  }>;
  onClose: () => void;
  onAddToCart?: (storeId: string, storeName: string, size: string) => void;
  mode: "view" | "add"; // view: solo ver stock; add: seleccionar talla/tienda y agregar
}

export default function StockModal({
  productName,
  price,
  variants,
  onClose,
  onAddToCart,
  mode,
}: StockModalProps) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);

  const activeVariant = selectedSize
    ? variants.find((v) => v.size === selectedSize)
    : null;
  const storesForSize = activeVariant?.inventory || [];

  const handleSizeClick = (size: string) => {
    setSelectedSize(size);
    setSelectedStoreId(null);
  };

  const handleAdd = () => {
    if (!selectedSize) {
      alert("Selecciona una talla");
      return;
    }
    if (!selectedStoreId) {
      alert("Selecciona una tienda");
      return;
    }
    const store = storesForSize.find((s) => s.store.id === selectedStoreId);
    if (store && onAddToCart) {
      onAddToCart(selectedStoreId, store.store.name, selectedSize);
    }
  };

  // Tabla de stock resumida (solo para modo "view")
  const storeMap = new Map<string, Map<string, number>>();
  for (const variant of variants) {
    for (const inv of variant.inventory) {
      const storeName = inv.store.name;
      if (!storeMap.has(storeName)) storeMap.set(storeName, new Map());
      const sizeMap = storeMap.get(storeName)!;
      const current = sizeMap.get(variant.size) || 0;
      sizeMap.set(variant.size, current + inv.quantity);
    }
  }
  const stockData = Array.from(storeMap.entries()).map(([store, sizeMap]) => ({
    store,
    sizes: Array.from(sizeMap.entries()).map(([size, qty]) => ({ size, qty })),
  }));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="relative max-h-[85vh] w-full max-w-3xl overflow-auto rounded-2xl bg-[#1A1A1A] border border-[#333] shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-[#1A1A1A] border-b border-[#333] px-6 py-4">
          <h3 className="text-xl font-bold text-white">{productName}</h3>
          <p className="text-[#2ECC71] font-mono">{formatCurrency(price)}</p>
        </div>

        <div className="p-6">
          {mode === "add" ? (
            // ========== MODO AGREGAR ==========
            <>
              {/* Talla */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-white mb-[5px]">
                  Talla
                </label>
                <div className="flex flex-wrap gap-[5px]">
                  {variants.map((v) => (
                    <button
                      key={v.size}
                      onClick={() => handleSizeClick(v.size)}
                      className={`px-3 py-1.5 text-xs font-semibold !rounded-md transition-all ${
                        selectedSize === v.size
                          ? "bg-[#E8621A] text-white border border-[#E8621A]"
                          : "bg-[#111111] border border-[#2D2D2D] text-[#D1D5DB] hover:border-[#E8621A] hover:text-white"
                      }`}
                      style={{
                        fontFamily: "Arial, sans-serif",
                        borderRadius: "0.375rem",
                      }}
                    >
                      {v.size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tienda (solo si hay talla seleccionada) */}
              {selectedSize && (
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-white mb-[5px]">
                    Sucursal
                  </label>
                  <select
                    value={selectedStoreId || ""}
                    onChange={(e) => setSelectedStoreId(e.target.value)}
                    className="w-full bg-[#333] text-white p-2 rounded-md border border-[#555] focus:outline-none focus:border-[#E8621A]"
                    style={{
                      fontFamily: "Arial, sans-serif",
                      height: "40px",
                      paddingLeft: "8px",
                      paddingRight: "8px",
                      marginBottom: "10px",
                    }}
                  >
                    <option value="">Selecciona una tienda</option>
                    {storesForSize.map((store) => (
                      <option key={store.store.id} value={store.store.id}>
                        {store.store.name} - Stock: {store.quantity} uds
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </>
          ) : (
            // ========== MODO VER STOCK ==========
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Stock por sucursal
              </label>
              {stockData.length === 0 ? (
                <p className="text-center text-[#9CA3AF]">
                  No hay inventario disponible.
                </p>
              ) : (
                <div className="space-y-4">
                  {stockData.map(({ store, sizes }) => (
                    <div
                      key={store}
                      className="border-b border-[#333] pb-3 last:border-0"
                    >
                      <h4 className="font-semibold text-white mb-1">{store}</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                        {sizes.map(({ size, qty }) => (
                          <div key={size} className="flex justify-between">
                            <span className="text-[#9CA3AF]">Talla {size}</span>
                            <span
                              className={
                                qty > 0 ? "text-[#2ECC71]" : "text-[#E8621A]"
                              }
                            >
                              {qty} uds
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Botones acción */}
        <div className="sticky bottom-0 bg-[#1A1A1A] border-t border-[#333] px-6 py-4 flex justify-end gap-[5px]">
          <button
            onClick={onClose}
            className="bt-button-gray rounded-lg bg-[#2A2A2A] px-5 py-2 text-sm font-extrabold tracking-[0.15em] text-white hover:bg-[#2c2c2c]"
            style={{ fontFamily: "Arial, sans-serif" }}
          >
            Cerrar
          </button>
          {mode === "add" && (
            <button
              onClick={handleAdd}
              className="bt-button-primary rounded-[14px] text-xs tracking-[0.18em]"
              style={{ fontFamily: "Arial, sans-serif" }}
            >
              Agregar al carrito
            </button>
          )}
        </div>
      </div>
    </div>
  );
}