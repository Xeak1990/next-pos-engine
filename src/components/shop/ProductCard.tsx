"use client";

import { useState } from "react";
import StockModal from "./StockModal";
import { Product } from "../../types";
import { formatCurrency } from "../../lib/utils";

export default function ProductCard({ product }: { product: Product }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  const variants = product.variants;
  const colors = [...new Set(variants.map((v) => v.color))];
  const firstVariant = variants[0];
  const price = selectedSize
    ? Number(variants.find((v) => v.size === selectedSize)?.price || 0)
    : Number(firstVariant?.price || 0);

  const availableSizes = variants.map((v) => v.size);
  const firstColor = colors[0] || "Sin color";

  const handleSizeClick = (size: string) => {
    setSelectedSize(selectedSize === size ? null : size);
  };

  const handleViewStock = () => {
    setIsModalOpen(true);
  };

  return (
    <>
      {/* Altura ajustable: cambia el valor entre corchetes */}
      <article className="bt-panel rounded-[24px] flex flex-col h-[350px] transition-all duration-200 hover:border-[#E8621A] overflow-hidden">
        {/* MITAD SUPERIOR */}
        <div className="flex-1 bg-[#242424] relative">
          <div className="w-[88%] mx-auto h-full relative">
            {/* Badge categoría arriba izquierda */}
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
                  boxShadow:
                    "inset 0 1px 1px rgba(255,255,255,0.05), 0 2px 4px rgba(0,0,0,0.2)",
                }}
              >
                {product.category}
              </span>
            </div>
            {/* Emoji centrado */}
            <div className="flex items-center justify-center h-full">
              <span className="text-7xl md:text-8xl">👟</span>
            </div>
          </div>
        </div>

        {/* MITAD INFERIOR: fondo gris oscuro */}
        <div className="bg-[#111111] flex flex-col flex-shrink-0">
          <div className="w-[88%] mx-auto pt-[2px] flex flex-col">
            {/* Nombre */}
            <h3
              className="text-xl font-[900] uppercase text-white tracking-tight mb-[-8px]"
              style={{
                fontFamily: "Bebas Neue, sans-serif",
                letterSpacing: "0.12em",
              }}
            >
              {product.name}
            </h3>

            {/* Color */}
            <p className="text-[13px] font-medium text-[#9CA3AF] lowercase mb-2">
              {firstColor}
            </p>

            {/* Tallas */}
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
                    style={{
                      fontFamily: "Arial, sans-serif",
                      borderRadius: "0.375rem",
                    }}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Precio y botón Ver stock (rectangular, gris claro, texto blanco, Arial) */}
            <div className="mt-auto pt-3 flex items-center justify-between">
              <p
                className="font-mono !text-5xl !font-black text-[#E8621A]"
                style={{ 
                  fontSize: "22px",
                  fontWeight: 600 
                }}
              >
                {formatCurrency(price)}
              </p>
              <button
                onClick={handleViewStock}
                className="bt-button-gray rounded-[14px] text-xs tracking-[0.18em]"
                style={{ fontFamily: "Arial, sans-serif" }}
              >
                Ver stock
              </button>
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
        />
      )}
    </>
  );
}
