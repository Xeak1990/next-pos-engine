"use client";

import { useEffect, useRef, type ReactNode } from "react";
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
    discount?: number;
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
    document.body
  );
}

export default function TicketModal({ isOpen, onClose, orderData }: TicketModalProps) {
  const ticketContainerRef = useRef<HTMLDivElement>(null);
  const currentPrintCloneRef = useRef<HTMLDivElement | null>(null);

  // Función para eliminar cualquier clon anterior
  const removePreviousPrintClone = () => {
    if (currentPrintCloneRef.current && document.body.contains(currentPrintCloneRef.current)) {
      document.body.removeChild(currentPrintCloneRef.current);
      currentPrintCloneRef.current = null;
    }
    // Por si hay algún clon huérfano (con clase ticket-print-area)
    const existingClones = document.querySelectorAll('.ticket-print-area');
    existingClones.forEach(clone => {
      if (clone.parentNode) clone.parentNode.removeChild(clone);
    });
  };

  const handlePrint = () => {
    const originalTicket = ticketContainerRef.current;
    if (!originalTicket) return;

    // Limpiar cualquier clon previo antes de crear uno nuevo
    removePreviousPrintClone();

    // Clonar el ticket (incluyendo todos los estilos y clases)
    const ticketClone = originalTicket.cloneNode(true) as HTMLDivElement;

    // Añadir clase que usamos para los estilos de impresión
    ticketClone.classList.add("ticket-print-area");

    // Insertar el clon al final del body
    document.body.appendChild(ticketClone);
    currentPrintCloneRef.current = ticketClone;

    // Forzar reflow
    void ticketClone.offsetHeight;

    // Guardar referencia para el evento afterprint
    const onPrintDone = () => {
      removePreviousPrintClone();
      window.removeEventListener('afterprint', onPrintDone);
    };

    // Imprimir (sin abrir ventana nueva)
    window.addEventListener('afterprint', onPrintDone);
    window.print();
  };

  if (!isOpen) return null;

  const MODAL_WIDTH_PX = 450;
  const MODAL_HEIGHT_PX = 600;
  const BUTTON_WIDTH_PX = 120;

  return (
    <TicketModalPortal>
      <div
        className="bg-[#1A1A1A] rounded-[24px] shadow-xl border border-gray-600 overflow-hidden flex flex-col"
        style={{ width: `${MODAL_WIDTH_PX}px`, height: `${MODAL_HEIGHT_PX}px` }}
      >
        <div className="flex-1 overflow-auto p-4">
          <div className="flex items-center justify-center min-h-full">
            <div ref={ticketContainerRef}>
              <TicketView
                folio={orderData.folio}
                items={orderData.items}
                subtotal={orderData.subtotal}
                iva={orderData.iva}
                discount={orderData.discount || 0}
                total={orderData.total}
                paymentMethod={orderData.paymentMethod}
                storeLocation={orderData.storeLocation}
              />
            </div>
          </div>
        </div>
        <div className="flex justify-center gap-[10px] my-[10px]">
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
        </div>
      </div>
    </TicketModalPortal>
  );
}