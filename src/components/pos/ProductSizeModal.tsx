"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { formatCurrency } from "../../lib/utils";

interface Variant {
  id: string;
  size: string;
  color: string;
  stock: number;
  price: number;
}

interface ProductSizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  variants: Variant[];
  onAddToCart: (variantId: string, size: string, price: number, stock: number) => void;
  canEdit: boolean;
}

function ModalPortal({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (typeof document === "undefined") return;
    const { body, documentElement } = document;
    const previousBodyOverflow = body.style.overflow;
    const previousHtmlOverflow = documentElement.style.overflow;
    body.style.overflow = "hidden";
    documentElement.style.overflow = "hidden";
    return () => {
      body.style.overflow = previousBodyOverflow;
      documentElement.style.overflow = previousHtmlOverflow;
    };
  }, []);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      style={{ top: 0, right: 0, bottom: 0, left: 0 }}
    >
      {children}
    </div>,
    document.body,
  );
}

export default function ProductSizeModal({
  isOpen,
  onClose,
  productName,
  variants,
  onAddToCart,
  canEdit,
}: ProductSizeModalProps) {
  if (!isOpen) return null;

  // ============================================================
  // DIMENSIONES DEL MODAL (ancho fijo, altura automática)
  // ============================================================
  const MODAL_WIDTH_PX = 450;   // ancho fijo (puedes cambiarlo)
  // La altura será automática según el contenido, con un máximo del 80% de la ventana
  // ============================================================

  // ============================================================
  // DIMENSIONES DE LOS BOTONES DE TALLA (en píxeles)
  // ============================================================
  const SIZE_BTN_WIDTH_PX = 55;        // ancho fijo de cada botón
  const SIZE_BTN_PADDING_VERTICAL = 12; // padding vertical (px)
  const SIZE_BTN_PADDING_HORIZONTAL = 8; // padding horizontal (px)
  // ============================================================

  // ============================================================
  // DIMENSIONES DEL BOTÓN "CANCELAR" (en píxeles)
  // ============================================================
  const CANCEL_BTN_WIDTH_PX = 100;      // ancho fijo
  const CANCEL_BTN_PADDING_VERTICAL = 8;
  const CANCEL_BTN_PADDING_HORIZONTAL = 16;
  // ============================================================

  const basePrice = variants[0]?.price || 0;

  return (
    <ModalPortal>
      {/* Modal: ancho fijo, altura automática (max-h-[80vh]) y scroll interno si es necesario */}
      <div
        className="bg-[#1A1A1A] rounded-[24px] shadow-xl overflow-hidden flex flex-col"
        style={{
          width: `${MODAL_WIDTH_PX}px`,
          maxHeight: "80vh",          // altura máxima (80% de la ventana)
          border: "1px solid #333333",
        }}
      >
        {/* Área de contenido con scroll vertical si excede maxHeight */}
        <div className="flex-1 overflow-y-auto">
          <div className="w-[88%] mx-auto py-4 space-y-[12px]">
            {/* Cabecera */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-[#94A3B8]">
                  Seleccionar talla
                </p>
                <h2 className="mt-1 text-2xl text-white">{productName}</h2>
                <p className="text-lg font-bold text-[#E8621A] mt-1">
                  {formatCurrency(basePrice)}
                </p>
              </div>
            </div>

            {/* Botones de talla – diseño flexible (wrap) */}
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-gray-400 mb-3">
                Seleccionar talla
              </p>
              <div className="flex flex-wrap gap-[10px]">
                {variants.map((variant) => {
                  const isActive = variant.stock > 0 && canEdit;
                  return (
                    <button
                      key={variant.id}
                      onClick={() => {
                        if (isActive) {
                          onAddToCart(
                            variant.id,
                            variant.size,
                            variant.price,
                            variant.stock
                          );
                          onClose();
                        }
                      }}
                      disabled={!isActive}
                      style={{
                        fontFamily: "Arial, sans-serif",
                        backgroundColor: isActive ? "#1F1F1F" : "#111111",
                        color: isActive ? "#FFFFFF" : "#6B7280",
                        opacity: !isActive ? 0.5 : 1,
                        borderRadius: "0.5rem",
                        padding: `${SIZE_BTN_PADDING_VERTICAL}px ${SIZE_BTN_PADDING_HORIZONTAL}px`,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.2s ease",
                        cursor: isActive ? "pointer" : "not-allowed",
                        border: "1px solid #4B5563",
                        textAlign: "center",
                        width: `${SIZE_BTN_WIDTH_PX}px`,
                      }}
                      onMouseEnter={(e) => {
                        if (isActive) {
                          e.currentTarget.style.backgroundColor = "#E8621A";
                          e.currentTarget.style.border = "1px solid #E8621A";
                          e.currentTarget.style.color = "#FFFFFF";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (isActive) {
                          e.currentTarget.style.backgroundColor = "#1F1F1F";
                          e.currentTarget.style.border = "1px solid #4B5563";
                          e.currentTarget.style.color = "#FFFFFF";
                        }
                      }}
                    >
                      <span className="text-sm font-bold">{variant.size}</span>
                      <span className="text-[10px] text-gray-300">
                        {variant.color}
                      </span>
                      <span className="text-[9px]">
                        {variant.stock > 0 ? `${variant.stock} uds` : "Agotado"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Botón Cancelar fijo abajo */}
        <div className="flex justify-end px-[10px] pb-[10px] pt-0">
          <button
            onClick={onClose}
            style={{
              fontFamily: "Arial, sans-serif",
              backgroundColor: "#1F1F1F",
              color: "#FFFFFF",
              borderRadius: "0.5rem",
              padding: `${CANCEL_BTN_PADDING_VERTICAL}px ${CANCEL_BTN_PADDING_HORIZONTAL}px`,
              fontSize: "0.72rem",
              fontWeight: 800,
              letterSpacing: "0.15em",
              border: "1px solid #4B5563",
              cursor: "pointer",
              transition: "background-color 0.2s ease",
              width: `${CANCEL_BTN_WIDTH_PX}px`,
              textAlign: "center",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#2C2C2C";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#1F1F1F";
            }}
          >
            Cancelar
          </button>
        </div>
      </div>
    </ModalPortal>
  );
}