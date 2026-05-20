"use client";

import { useState } from "react";
import StockModal from "./StockModal";
import { Product } from "../../types";
import { formatCurrency } from "../../lib/utils";
import { useCartWeb } from "../../context/CartContextWeb";

export default function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCartWeb();
  const [selectedVariantId, setSelectedVariantId] = useState(product.variants[0]?.id || "");
  const [quantity, setQuantity] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const selectedVariant = product.variants.find(v => v.id === selectedVariantId);
  const price = selectedVariant ? Number(selectedVariant.price) : 0;
  const totalStock = selectedVariant?.inventory.reduce((sum, inv) => sum + inv.quantity, 0) || 0;
  const color = product.variants[0]?.color || "Sin color";
  const allInventory = product.variants.flatMap(v => v.inventory);

  const handleAddToCart = () => {
    if (!selectedVariant) return;
    addItem({
      productId: product.id,
      name: `${product.name} (${selectedVariant.size})`,
      price,
      quantity,
      image: undefined,
      size: selectedVariant.size,
    });
    setQuantity(1);
  };

  return (
    <>
      <article className="bt-panel rounded-2xl p-5 flex flex-col h-full transition-all hover:border-[#E8621A]">
        <div className="mb-3">
          <p className="text-xs uppercase tracking-[0.22em] text-[#94A3B8]">{product.brand}</p>
          <h3 className="mt-1 text-xl font-bold text-white">{product.name}</h3>
          <p className="text-sm text-[#9CA3AF]">{color}</p>
        </div>

        {/* Selector de talla */}
        <div className="mb-3">
          <label className="text-xs uppercase tracking-[0.2em] text-[#94A3B8]">Talla</label>
          <select
            value={selectedVariantId}
            onChange={(e) => setSelectedVariantId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[#333] bg-[#0F0F0F] p-2 text-white text-sm"
          >
            {product.variants.map(v => (
              <option key={v.id} value={v.id}>{v.size} - {formatCurrency(v.price)}</option>
            ))}
          </select>
        </div>

        {/* Cantidad */}
        <div className="mb-3">
          <label className="text-xs uppercase tracking-[0.2em] text-[#94A3B8]">Cantidad</label>
          <input
            type="number"
            min={1}
            max={totalStock}
            value={quantity}
            onChange={(e) => setQuantity(Math.min(Number(e.target.value), totalStock))}
            className="mt-1 w-full rounded-lg border border-[#333] bg-[#0F0F0F] p-2 text-white text-sm"
          />
        </div>

        <div className="mt-auto pt-4 border-t border-[#2A2A2A]">
          <div className="flex items-center justify-between">
            <p className="font-mono text-2xl font-bold text-[#2ECC71]">{formatCurrency(price)}</p>
            <div className="flex gap-2">
              <button
                onClick={handleAddToCart}
                disabled={totalStock === 0}
                className="rounded-full bg-[#E8621A] px-4 py-2 text-xs font-semibold text-white hover:bg-[#c05210] disabled:opacity-50"
              >
                Agregar
              </button>
              <button
                onClick={() => setIsModalOpen(true)}
                className="rounded-full border border-[#333] bg-[#111] px-4 py-2 text-xs font-semibold text-[#D1D5DB] hover:border-[#E8621A] hover:text-white"
              >
                Ver stock
              </button>
            </div>
          </div>
        </div>
      </article>

      {isModalOpen && (
        <StockModal
          productName={`${product.name} (${color})`}
          price={price.toString()}
          variants={product.variants}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}