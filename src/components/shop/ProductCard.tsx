"use client";

import { useState } from "react";
import StockModal from "./StockModal";
import { Product } from "../../types";
import { formatCurrency } from "../../lib/utils";
import { useCartWeb } from "../../context/CartContextWeb";

interface ProductCardProps {
  product: Product;
}

const BUTTON_WIDTH_PX = 90;
const BUTTON_HEIGHT_PX = 34;

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCartWeb();
  const [modalMode, setModalMode] = useState<"add" | "view">("add");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  const variants = product.variants;
  const colors = [...new Set(variants.map((v) => v.color))];
  const firstVariant = variants[0];

  const activeVariant = selectedSize
    ? variants.find((v) => v.size === selectedSize)
    : firstVariant;

  const price = activeVariant ? Number(activeVariant.price) : 0;
  const availableSizes = variants.map((v) => v.size);
  const firstColor = colors[0] || "Sin color";

  const handleSizeClick = (size: string) => {
    setSelectedSize(selectedSize === size ? null : size);
  };

  const openModal = (mode: "add" | "view") => {
    setModalMode(mode);
    setIsModalOpen(true);
  };

  const handleAddToCartFromModal = (storeId: string, storeName: string, size: string) => {
    const variant = variants.find(v => v.size === size);
    if (!variant) return;

    const result = addItem({
      productId: product.id,
      variantId: variant.id,          // ← agregado
      name: `${product.name} ${product.brand ? `(${product.brand})` : ""}`,
      price: Number(variant.price),
      quantity: 1,
      size: size,
      image: undefined,
      storeId,
      storeName,
    });

    if (!result.success && result.message) {
      alert(result.message);
    } else {
      setIsModalOpen(false);
    }
  };

  return (
    <>
      <article className="bt-panel rounded-[24px] flex flex-col h-[350px] transition-all duration-200 hover:border-[#E8621A] overflow-hidden">
        {/* MITAD SUPERIOR */}
        <div className="flex-1 bg-[#242424] relative">
          <div className="w-[88%] mx-auto h-full relative">
            <div className="absolute top-[15px] left-[0px]">
              <span
                style={{
                  display: "inline-block",
                  borderRadius: "9999px",
                  backgroundColor: "#1A3A5F",
                  padding: "4px 12px",
                  fontSize: "10px",
                  fontWeight: "bold",
                  textTransform: "uppercase",
                  letterSpacing: "0.2em",
                  color: "#FFFFFF",
                  lineHeight: "1.2",
                  boxShadow: "inset 0 1px 1px rgba(255,255,255,0.05), 0 2px 4px rgba(0,0,0,0.2)",
                }}
              >
                {product.category}
              </span>
            </div>
            <div className="flex items-center justify-center h-full">
              <span className="text-7xl md:text-8xl">👟</span>
            </div>
          </div>
        </div>

        {/* MITAD INFERIOR */}
        <div
          className="bg-[#111111] flex flex-col flex-shrink-0 py-4"
          style={{ paddingLeft: "24px", paddingRight: "24px", boxSizing: "border-box" }}
        >
          <div className="flex flex-col w-full">
            <h3
              className="text-xl font-[900] uppercase text-white tracking-tight mb-[-8px]"
              style={{ fontFamily: "Bebas Neue, sans-serif", letterSpacing: "0.12em" }}
            >
              {product.name}
            </h3>
            <p className="text-[13px] font-medium text-[#9CA3AF] lowercase mb-2">
              {firstColor}
            </p>
            <div className="mb-3">
              <div className="flex flex-wrap gap-[5px]">
                {availableSizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => handleSizeClick(size)}
                    className={`px-3 py-1.5 text-xs font-semibold !rounded-md transition-all ${
                      selectedSize === size
                        ? "bg-[#E8621A] text-white border border-[#E8621A]"
                        : "bg-[#111111] border border-[#2D2D2D] text-[#D1D5DB] hover:border-[#E8621A] hover:text-white"
                    }`}
                    style={{ fontFamily: "Arial, sans-serif", borderRadius: "0.375rem" }}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-auto pt-3 flex items-center justify-between gap-2">
              <p className="font-mono text-[22px] font-black text-[#E8621A]" style={{ fontWeight: 600 }}>
                {formatCurrency(price)}
              </p>
              <div className="flex gap-[5px]">
                <button
                  onClick={() => openModal("view")}
                  className="bt-button-gray rounded-[14px] text-xs tracking-[0.18em]"
                  style={{
                    fontFamily: "Arial, sans-serif",
                    width: `${BUTTON_WIDTH_PX}px`,
                    height: `${BUTTON_HEIGHT_PX}px`,
                    padding: "0",
                  }}
                >
                  Stock
                </button>
                <button
                  onClick={() => openModal("add")}
                  className="bt-button-primary rounded-[14px] text-xs tracking-[0.18em]"
                  style={{
                    fontFamily: "Arial, sans-serif",
                    width: `${BUTTON_WIDTH_PX}px`,
                    height: `${BUTTON_HEIGHT_PX}px`,
                    padding: "0",
                  }}
                >
                  Agregar
                </button>
              </div>
            </div>
          </div>
        </div>
      </article>

      {isModalOpen && (
        <StockModal
          productName={`${product.name} (${firstColor})`}
          price={price.toString()}
          variants={product.variants}
          onClose={() => setIsModalOpen(false)}
          onAddToCart={handleAddToCartFromModal}
          mode={modalMode}
        />
      )}
    </>
  );
}