"use client";

import { useState } from "react";
import { formatCurrency } from "../../lib/utils";
import StockModal from "./StockModal";
import { Product, Variant } from "../../types"; 

export default function ProductCard({ product }: { product: Product }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const allInventory = product.variants.flatMap((v) => v.inventory);

  return (
    <>
      <div className="bg-[#1A1A1A] border border-gray-800 p-8 flex flex-col h-full hover:border-[#E8621A] transition-colors">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-white uppercase tracking-tighter">{product.name}</h2>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">{product.brand} / {product.category}</p>
        </div>
        
        <div className="flex-grow space-y-4">
          {product.variants.map((variant: Variant) => (
            <div key={variant.id} className="flex justify-between items-center border-b border-gray-900 pb-2">
              <span className="text-gray-400 text-sm font-bold uppercase">Talla {variant.size}</span>
              <span className="text-white font-bold">{formatCurrency(variant.price)}</span>
            </div>
          ))}
        </div>

        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full mt-8 py-4 bg-white text-black font-bold uppercase text-xs tracking-widest hover:bg-[#E8621A] hover:text-white transition-all"
        >
          VER DISPONIBILIDAD
        </button>
      </div>

      {/* El modal se renderiza aquí pero al ser fixed aparecerá sobre todo el layout */}
      {isModalOpen && (
        <StockModal 
          productName={product.name}
          price={String(product.variants[0]?.price || 0)}
          inventory={allInventory}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}