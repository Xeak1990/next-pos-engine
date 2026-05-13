"use client";

import { useState } from "react";
import StockModal from "./StockModal";
import { Product, Variant } from "../../types";
import { formatCurrency } from "../../lib/utils";

export default function ProductCard({ product }: { product: Product }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const allInventory = product.variants.flatMap((variant) => variant.inventory);

  return (
    <>
      <article className="bt-panel flex h-full flex-col p-8 transition-all hover:border-[#E8621A]">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.22em] text-[#94A3B8]">
            {product.brand} / {product.category}
          </p>
          <h2 className="mt-4 text-4xl leading-none text-white">{product.name}</h2>
        </div>

        <div className="flex-1 space-y-4">
          {product.variants.map((variant: Variant) => (
            <div
              key={variant.id}
              className="flex items-center justify-between border-b border-[#2A2A2A] pb-3"
            >
              <span className="text-sm uppercase tracking-[0.16em] text-[#D1D5DB]">
                Talla {variant.size}
              </span>
              <span className="font-mono text-sm font-bold text-[#2ECC71]">
                {formatCurrency(variant.price)}
              </span>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="bt-button-primary mt-8 w-full px-5 py-4 text-xs"
        >
          Ver Disponibilidad
        </button>
      </article>

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
