"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import TicketView from "./TicketView";
import { createSale } from "../../actions/sales";

interface TicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaleSuccess: () => void; // limpia carrito y refresca
  orderData: {
    items: {
      variantId: string;
      name: string;
      size: string;
      price: number;
      quantity: number;
      stockAvailable: number;
    }[];
    subtotal: number;
    iva: number;
    discount: number;
    total: number;
    paymentMethod: string;
    storeLocation: string;
  };
  storeId: string;
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
    document.body
  );
}

export default function TicketModal({ isOpen, onClose, onSaleSuccess, orderData, storeId }: TicketModalProps) {
  const ticketContainerRef = useRef<HTMLDivElement>(null);
  const currentPrintCloneRef = useRef<HTMLDivElement | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saleCompleted, setSaleCompleted] = useState(false);
  const [saleFolio, setSaleFolio] = useState<string | null>(null);

  const removePreviousPrintClone = () => {
    if (currentPrintCloneRef.current && document.body.contains(currentPrintCloneRef.current)) {
      document.body.removeChild(currentPrintCloneRef.current);
      currentPrintCloneRef.current = null;
    }
    const existingClones = document.querySelectorAll('.ticket-print-area');
    existingClones.forEach(clone => {
      if (clone.parentNode) clone.parentNode.removeChild(clone);
    });
  };

  const handlePrint = () => {
    const originalTicket = ticketContainerRef.current;
    if (!originalTicket) return;

    removePreviousPrintClone();
    const ticketClone = originalTicket.cloneNode(true) as HTMLDivElement;
    ticketClone.classList.add("ticket-print-area");
    document.body.appendChild(ticketClone);
    currentPrintCloneRef.current = ticketClone;

    const onPrintDone = () => {
      removePreviousPrintClone();
      window.removeEventListener('afterprint', onPrintDone);
    };

    window.addEventListener('afterprint', onPrintDone);
    window.print();
  };

  const handleConfirmSale = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      const saleData = {
        storeId,
        items: orderData.items.map(item => ({
          variantId: item.variantId,
          quantity: item.quantity,
          price: item.price,
        })),
      };
      const result = await createSale(saleData);
      if (!result.success) {
        throw new Error(result.error || "Error desconocido");
      }
      const folioReal = result.saleId!.slice(-8).toUpperCase();
      setSaleFolio(`VTA-${folioReal}`);
      setSaleCompleted(true);
      onSaleSuccess(); // limpia carrito y notifica a PosPage para refrescar
    } catch (err: unknown) {
      let errorMessage = "No se pudo completar la venta. Intenta de nuevo.";
      if (err instanceof Error) errorMessage = err.message;
      else if (typeof err === "string") errorMessage = err;
      else if (err && typeof err === "object" && "message" in err && typeof err.message === "string")
        errorMessage = err.message;
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  const MODAL_WIDTH_PX = 450;
  const MODAL_HEIGHT_PX = 600;
  const BUTTON_WIDTH_PX = 120;

  // Datos para TicketView (folio temporal o real)
  const ticketViewData = {
    folio: saleCompleted ? saleFolio! : "PENDIENTE",
    items: orderData.items.map(i => ({ name: i.name, size: i.size, price: i.price, quantity: i.quantity })),
    subtotal: orderData.subtotal,
    iva: orderData.iva,
    discount: orderData.discount,
    total: orderData.total,
    paymentMethod: orderData.paymentMethod,
    storeLocation: orderData.storeLocation,
  };

  return (
    <TicketModalPortal>
      <div
        className="bg-[#1A1A1A] rounded-[24px] shadow-xl border border-gray-600 overflow-hidden flex flex-col"
        style={{ width: `${MODAL_WIDTH_PX}px`, height: `${MODAL_HEIGHT_PX}px` }}
      >
        <div className="flex-1 overflow-auto p-4">
          <div className="flex items-center justify-center min-h-full">
            <div ref={ticketContainerRef}>
              <TicketView {...ticketViewData} />
            </div>
          </div>
        </div>

        {error && (
          <div className="text-red-400 text-sm text-center bg-red-900/30 mx-4 mb-2 p-2 rounded">
            {error}
          </div>
        )}

        <div className="flex justify-center gap-[10px] my-[10px]">
          {!saleCompleted ? (
            <>
              <button
                onClick={onClose}
                disabled={isProcessing}
                className="bt-button-ghost rounded-[12px] text-xs"
                style={{ fontFamily: "Arial, sans-serif", width: `${BUTTON_WIDTH_PX}px`, padding: "0.75rem 0" }}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmSale}
                disabled={isProcessing}
                className="bt-button-primary rounded-[12px] text-xs"
                style={{ fontFamily: "Arial, sans-serif", width: `${BUTTON_WIDTH_PX}px`, padding: "0.75rem 0" }}
              >
                {isProcessing ? "Procesando..." : "Confirmar Venta"}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onClose}
                className="bt-button-ghost rounded-[12px] text-xs"
                style={{ fontFamily: "Arial, sans-serif", width: `${BUTTON_WIDTH_PX}px`, padding: "0.75rem 0" }}
              >
                Cerrar
              </button>
              <button
                onClick={handlePrint}
                className="bt-button-primary rounded-[12px] text-xs"
                style={{ fontFamily: "Arial, sans-serif", width: `${BUTTON_WIDTH_PX}px`, padding: "0.75rem 0" }}
              >
                Imprimir Ticket
              </button>
            </>
          )}
        </div>
      </div>
    </TicketModalPortal>
  );
}