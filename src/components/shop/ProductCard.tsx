"use client";

import { useState } from "react";
import StockModal from "./StockModal";
import { Product, Variant } from "../../types";
import { formatCurrency } from "../../lib/utils";
import { useCartWeb } from "../../context/CartContextWeb";

export default function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCartWeb();
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    product.variants[0]?.id || ""
  );
  const [quantity, setQuantity] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const selectedVariant = product.variants.find((v) => v.id === selectedVariantId);
  // ✅ Corrección: usar Number() en lugar de parseFloat
  const price = selectedVariant ? Number(selectedVariant.price) : 0;
  // Stock total sumando todas las tiendas para esta variante
  const totalStock =
    selectedVariant?.inventory.reduce((sum, inv) => sum + inv.quantity, 0) || 0;

  const handleAddToCart = () => {
    if (!selectedVariant) return;
    addItem({
      productId: product.id,
      name: `${product.name} (${selectedVariant.size})`,
      price: price,
      quantity: quantity,
      image: undefined,
      size: selectedVariant.size,
    });
    setQuantity(1);
  };

  // Para el modal de stock
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

        {/* Selector de talla */}
        <div className="mb-4">
          <label className="text-xs uppercase tracking-[0.2em] text-[#94A3B8]">
            Talla
          </label>
          <select
            value={selectedVariantId}
            onChange={(e) => setSelectedVariantId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[#333333] bg-[#0F0F0F] p-2 text-white"
          >
            {product.variants.map((variant) => (
              <option key={variant.id} value={variant.id}>
                {variant.size} - {formatCurrency(variant.price)}
              </option>
            ))}
          </select>
        </div>

        {/* Cantidad */}
        <div className="mb-4">
          <label className="text-xs uppercase tracking-[0.2em] text-[#94A3B8]">
            Cantidad
          </label>
          <input
            type="number"
            min={1}
            max={totalStock}
            value={quantity}
            onChange={(e) => setQuantity(Math.min(Number(e.target.value), totalStock))}
            className="mt-1 w-full rounded-lg border border-[#333333] bg-[#0F0F0F] p-2 text-white"
          />
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

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={totalStock === 0}
            className="flex-1 rounded-full bg-[#E8621A] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#c05210] disabled:opacity-50"
          >
            Agregar al carrito
          </button>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex-1 rounded-full border border-[#333333] bg-[#111111] px-4 py-3 text-sm font-semibold text-[#D1D5DB] transition hover:border-[#6B7280] hover:text-white"
          >
            Ver disponibilidad
          </button>
        </div>
      </article>

      {isModalOpen && (
        <StockModal
          productName={product.name}
          price={String(selectedVariant?.price || product.variants[0]?.price || 0)}
          inventory={allInventory}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}