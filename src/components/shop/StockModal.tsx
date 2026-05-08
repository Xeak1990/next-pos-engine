"use client";

import { formatCurrency } from "../../lib/utils";
import { Inventory } from "../../types"; // Importamos el tipo real definido anteriormente

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
    <div className="fixed inset-0 w-screen h-screen bg-black/95 backdrop-blur-md flex items-center justify-center z-[9999]">
      <div className="bg-[#1A1A1A] border border-[#333333] w-full max-w-md rounded-[20px] p-8 shadow-[0_4px_16px_rgba(0,0,0,0.5)]">
        <h2 className="text-3xl font-bebas text-white mb-2 uppercase">
          Disponibilidad
        </h2>
        <div className="flex justify-between items-start mb-10">
          <div>
            <h2 className="text-4xl font-bold text-white uppercase tracking-tighter">
              STOCK DISPONIBLE
            </h2>
            <p className="text-[#E8621A] font-bold text-sm uppercase tracking-widest mt-1">
              {productName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white text-4xl leading-none transition-colors"
            aria-label="Cerrar"
          >
            &times;
          </button>
        </div>

        <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-4 custom-scrollbar">
          {inventory.map((item, index) => (
            <div
              key={index}
              className="flex justify-between items-center p-6 bg-[#0F0F0F] border border-gray-800"
            >
              <div className="flex flex-col">
                <span className="text-white font-bold text-sm uppercase">
                  {item.store.name}
                </span>
                <span className="text-[10px] text-gray-600 uppercase tracking-widest">
                  {item.store.location}
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span
                  className={`text-sm font-bold uppercase ${item.quantity > 0 ? "text-[#2ECC71]" : "text-[#E74C3C]"}`}
                >
                  {item.quantity > 0
                    ? `${item.quantity} DISPONIBLES`
                    : "SIN STOCK"}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 pt-8 border-t border-gray-900 flex justify-between items-end">
          <div className="flex flex-col">
            <span className="text-gray-600 text-[10px] font-bold uppercase tracking-widest">
              Precio de lista
            </span>
            <span className="text-2xl font-bold text-white">
              {formatCurrency(price)}
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-10 py-4 bg-[#E8621A] text-white font-bold uppercase text-xs tracking-widest hover:bg-white hover:text-black transition-all"
          >
            VOLVER AL CATÁLOGO
          </button>
        </div>
      </div>
    </div>
  );
}
