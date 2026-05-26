"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import TicketView from "./TicketView";

interface TicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderData: {
    folio: string;
    items: {
      name: string;
      size: string;
      price: number;
      quantity: number;
    }[];
    subtotal: number;
    iva: number;
    discount?: number;      // ← agregado para descuento
    total: number;
    paymentMethod: string;
    storeLocation: string;
  };
}

function TicketModalPortal({ children }: { children: ReactNode }) {
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

export default function TicketModal({ isOpen, onClose, orderData }: TicketModalProps) {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  // ============================================================
  // DIMENSIONES DEL MODAL (píxeles)
  // ============================================================
  const MODAL_WIDTH_PX = 450;   // ancho del modal
  const MODAL_HEIGHT_PX = 600;  // alto del modal

  // ============================================================
  // DIMENSIONES DE LOS BOTONES (píxeles) – AJUSTA A TU GUSTO
  // ============================================================
  const BUTTON_WIDTH_PX = 120;   // ancho fijo para cada botón
  // ============================================================

  return (
    <TicketModalPortal>
      <div
        className="bg-[#1A1A1A] rounded-[24px] shadow-xl border border-gray-600 overflow-hidden flex flex-col"
        style={{ width: `${MODAL_WIDTH_PX}px`, height: `${MODAL_HEIGHT_PX}px` }}
      >
        {/* Área del ticket (scroll si es necesario) */}
        <div className="flex-1 overflow-auto p-4">
          <div className="flex items-center justify-center min-h-full">
            <TicketView
              folio={orderData.folio}
              items={orderData.items}
              subtotal={orderData.subtotal}
              iva={orderData.iva}
              discount={orderData.discount || 0}   // ← pasar descuento
              total={orderData.total}
              paymentMethod={orderData.paymentMethod}
              storeLocation={orderData.storeLocation}
            />
          </div>
        </div>

        {/* Contenedor de botones: centrado, con separación de 10px entre ellos y sin bordes */}
        <div className="flex justify-center gap-[10px] my-[10px]">
          <button
            onClick={onClose}
            className="bt-button-ghost rounded-[12px] text-xs"
            style={{
              fontFamily: "Arial, sans-serif",
              width: `${BUTTON_WIDTH_PX}px`,
              padding: "0.75rem 0",
            }}
          >
            Cerrar
          </button>
          <button
            onClick={handlePrint}
            className="bt-button-primary rounded-[12px] text-xs"
            style={{
              fontFamily: "Arial, sans-serif",
              width: `${BUTTON_WIDTH_PX}px`,
              padding: "0.75rem 0",
            }}
          >
            Imprimir Ticket
          </button>
        </div>
      </div>
    </TicketModalPortal>
  );
}