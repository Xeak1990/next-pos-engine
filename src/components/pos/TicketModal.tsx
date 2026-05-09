"use client";

import TicketView from "./TicketView";

// Definimos la interfaz estricta para los datos que vienen del Carrito
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
    total: number;
    paymentMethod: string;
    storeLocation: string;
  };
}

export default function TicketModal({ isOpen, onClose, orderData }: TicketModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      <div className="relative w-full max-w-sm animate-in fade-in zoom-in duration-300">
        
        {/* Botón para cerrar y limpiar el carrito */}
        <button 
          onClick={onClose}
          className="absolute -top-12 right-0 text-white/50 hover:text-white font-bebas tracking-[0.2em] text-xs transition-colors flex items-center gap-2"
        >
          FINALIZAR Y CERRAR <span className="text-lg">✕</span>
        </button>

        {/* Contenedor del Ticket con bordes redondeados según Guía de Estilos (20px) */}
        <div className="overflow-hidden rounded-[20px] shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <TicketView 
            folio={orderData.folio}
            items={orderData.items}
            subtotal={orderData.subtotal}
            iva={orderData.iva}
            total={orderData.total}
            paymentMethod={orderData.paymentMethod}
            storeLocation={orderData.storeLocation}
          />
        </div>

        {/* Acción de impresión nativa de Fedora/Linux */}
        <button 
          onClick={() => window.print()}
          className="w-full mt-4 py-4 bg-[#E8621A] text-white font-bebas text-xl tracking-[0.2em] rounded-[12px] hover:bg-[#FF7A2F] transition-all shadow-lg active:scale-95"
        >
          IMPRIMIR TICKET
        </button>
      </div>
    </div>
  );
}