"use client";

import { formatCurrency } from "../../lib/utils";

interface StockModalProps {
  productName: string;
  price: string;
  variants: Array<{
    id: string;
    size: string;
    color: string;
    inventory: Array<{ quantity: number; store: { name: string } }>;
  }>;
  onClose: () => void;
}

export default function StockModal({ productName, price, variants, onClose }: StockModalProps) {
  // Agrupar stock por sucursal y talla
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
    sizes: Array.from(sizeMap.entries()).map(([size, qty]) => ({ size, qty }))
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="relative max-h-[85vh] w-full max-w-2xl overflow-auto rounded-2xl bg-[#1A1A1A] border border-[#333] shadow-xl">
        {/* Cabecera fija */}
        <div className="sticky top-0 bg-[#1A1A1A] border-b border-[#333] px-6 py-4 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-white">{productName}</h3>
            <p className="text-[#2ECC71] font-mono">{formatCurrency(price)}</p>
          </div>
        </div>

        {/* Contenido con scroll interno */}
        <div className="p-6">
          {stockData.length === 0 ? (
            <p className="text-center text-[#9CA3AF]">No hay inventario disponible.</p>
          ) : (
            <div className="space-y-6">
              {stockData.map(({ store, sizes }) => (
                <div key={store} className="border-b border-[#333] pb-4 last:border-0">
                  <h4 className="font-semibold text-white mb-2">{store}</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                    {sizes.map(({ size, qty }) => (
                      <div key={size} className="flex justify-between">
                        <span className="text-[#9CA3AF]">Talla {size}</span>
                        <span className={qty > 0 ? "text-[#2ECC71]" : "text-[#E8621A]"}>
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

        {/* Solo botón cerrar al pie */}
        <div className="sticky bottom-0 bg-[#1A1A1A] border-t border-[#333] px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-full bg-[#E8621A] px-6 py-2 text-sm font-semibold text-white hover:bg-[#c05210]"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}