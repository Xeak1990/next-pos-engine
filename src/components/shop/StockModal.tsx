"use client";

import { Inventory } from "../../types";
import { formatCurrency } from "../../lib/utils";

interface StockModalProps {
  productName: string;
  price: string;
  inventory: Inventory[];
  onClose: () => void;
}

export default function StockModal({
  productName,
  price,
  inventory,
  onClose,
}: StockModalProps) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm">
      <div className="bt-panel w-full max-w-2xl p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[#94A3B8]">Disponibilidad</p>
            <h2 className="mt-3 text-4xl text-white">{productName}</h2>
            <p className="mt-3 font-mono text-xl font-bold text-[#2ECC71]">
              {formatCurrency(price)}
            </p>
          </div>

          <button type="button" onClick={onClose} className="bt-button-ghost px-4 py-2 text-xs">
            Cerrar
          </button>
        </div>

        <div className="custom-scrollbar mt-8 max-h-[50vh] space-y-3 overflow-y-auto pr-1">
          {inventory.map((item, index) => (
            <div
              key={`${item.store.id}-${index}`}
              className="rounded-[12px] border border-[#333333] bg-[#111111] px-5 py-4"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-lg font-semibold text-white">{item.store.name}</p>
                  <p className="mt-1 text-sm text-[#94A3B8]">{item.store.location}</p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 font-mono text-xs font-semibold ${
                    item.quantity > 0
                      ? "bg-[#2ECC71]/12 text-[#2ECC71]"
                      : "bg-[#E8621A]/12 text-[#E8621A]"
                  }`}
                >
                  {item.quantity > 0 ? `${item.quantity} disponibles` : "Sin stock"}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-end">
          <button type="button" onClick={onClose} className="bt-button-primary px-6 py-3 text-xs">
            Volver al Catalogo
          </button>
        </div>
      </div>
    </div>
  );
}
