"use client";

import { useState } from "react";
import { formatCurrency } from "../../lib/utils";
import { useCart } from "../../lib/CartContext";
import PaymentModal from "./PaymentModal";
import TicketModal from "./TicketModal";

interface CartItemSummary {
  variantId: string;
  name: string;
  size: string;
  price: number;
  quantity: number;
  stockAvailable: number;
}

interface OrderSummary {
  folio: string;
  items: CartItemSummary[];
  subtotal: number;
  iva: number;
  total: number;
  paymentMethod: string;
  storeLocation: string;
}

const generateFolio = () => `VTA-${Math.floor(1000 + Math.random() * 9000)}`;

export default function CartPanel() {
  const { items, addItem, removeOne, removeItem, clearCart } = useCart();
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isTicketOpen, setIsTicketOpen] = useState(false);
  const [lastOrder, setLastOrder] = useState<OrderSummary | null>(null);

  // Cálculos automáticos (RF06) [cite: 84, 228]
  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const iva = subtotal * 0.16; // IVA 16% según requerimientos [cite: 338]
  const total = subtotal + iva;

  const handleProcessPayment = (method: string) => {
    const generatedFolio = generateFolio();
    const orderData: OrderSummary = {
      folio: generatedFolio,
      items: items,
      subtotal,
      iva,
      total,
      paymentMethod: method,
      storeLocation: "Plaza Américas, Xalapa, Ver.", // Ubicación actual del POS
    };
    setLastOrder(orderData);
    setIsPaymentOpen(false);
    setIsTicketOpen(true);
  };

  return (
    /* Estructura del Panel Lateral (Mockup 7):
       Se usa 'h-full min-h-0' y 'flex flex-col relative' para que el botón de pago permanezca anclado al fondo.
    */
    <div className="bg-[#1A1A1A] border-l border-[#333333] h-full min-h-0 flex flex-col relative font-sans overflow-hidden">
      
      {/* HEADER DEL CARRITO (Fijo arriba) [cite: 434, 436] */}
      <div className="p-6 border-b border-[#333333] flex-none">
        <h2 className="text-2xl font-bebas text-white tracking-tighter uppercase">
          Carrito de Venta
        </h2>
        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">
          PRODUCTOS: {items.length}
        </p>
      </div>

      {/* LISTA DE PRODUCTOS (Sección con Scroll independiente) */}
      <div className="flex-grow overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {items.map((item: CartItemSummary) => (
          <div key={item.variantId} className="bg-[#0F0F0F] p-4 border border-[#333333] rounded-[8px]">
            <div className="flex justify-between items-start">
              <span className="text-white font-bold text-[10px] uppercase">{item.name}</span>
              <button onClick={() => removeItem(item.variantId)} className="text-gray-600 hover:text-[#E74C3C] transition-colors">✕</button>
            </div>
            <div className="flex justify-between items-end mt-4">
              <div className="flex items-center border border-[#333333] rounded-[4px] bg-[#1A1A1A]">
                <button onClick={() => removeOne(item.variantId)} className="px-3 py-1 text-white text-xs hover:bg-[#333333]">-</button>
                <span className="px-3 text-[10px] font-mono text-white border-x border-[#333333]">{item.quantity}</span>
                <button onClick={() => addItem(item, item.stockAvailable)} className="px-3 py-1 text-white text-xs hover:bg-[#333333]">+</button>
              </div>
              <span className="text-white font-mono font-bold text-xs">{formatCurrency(item.price * item.quantity)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* PANEL DE PAGO (Fijo abajo - Mockup 7) [cite: 308, 434] */}
      <div className="p-6 bg-[#0F0F0F] border-t border-[#333333] space-y-2 flex-none shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        <div className="flex justify-between text-[10px] text-gray-500 font-bold uppercase font-mono">
          <span>SUBTOTAL</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between text-[10px] text-gray-500 font-bold uppercase pb-2 font-mono">
          <span>IVA (16%)</span>
          <span>{formatCurrency(iva)}</span>
        </div>
        <div className="flex justify-between text-2xl font-bebas text-[#2ECC71] pt-4 border-t border-[#1A1A1A]">
          <span>TOTAL</span>
          <span>{formatCurrency(total)}</span>
        </div>

        {/* Botón Pagar (Color Naranja #E8621A según Guía de Estilos) [cite: 165, 434, 438] */}
        <button
          onClick={() => setIsPaymentOpen(true)}
          disabled={items.length === 0}
          className="w-full mt-4 py-4 bg-[#E8621A] text-white font-bebas text-lg tracking-[0.2em] rounded-[8px] hover:bg-[#FF7A2F] active:scale-[0.98] transition-all disabled:opacity-30 disabled:grayscale"
        >
          PAGAR AHORA 
        </button>
      </div>

      {/* Modales de Flujo (Mockups 9 y 12) [cite: 51, 54] */}
      <PaymentModal 
        isOpen={isPaymentOpen} 
        total={total} 
        onConfirm={handleProcessPayment} 
        onCancel={() => setIsPaymentOpen(false)} 
      />

      {lastOrder && (
        <TicketModal
          isOpen={isTicketOpen}
          onClose={() => {
            setIsTicketOpen(false);
            clearCart(); // Limpieza de carrito al finalizar (RF07) [cite: 228]
          }}
          orderData={lastOrder}
        />
      )}
    </div>
  );
}