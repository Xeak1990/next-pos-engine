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
  discount: number;
  total: number;
  paymentMethod: string;
  storeLocation: string;
}

const generateFolio = () => `VTA-${Math.floor(1000 + Math.random() * 9000)}`;

export default function CartPanel({ storeLocation }: { storeLocation: string }) {
  const { items, addItem, removeOne, removeItem, clearCart } = useCart();
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isTicketOpen, setIsTicketOpen] = useState(false);
  const [lastOrder, setLastOrder] = useState<OrderSummary | null>(null);

  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const iva = subtotal * 0.16;
  const discount = 0;
  const total = subtotal + iva - discount;

  const handleProcessPayment = (method: string) => {
    const orderData: OrderSummary = {
      folio: generateFolio(),
      items,
      subtotal,
      iva,
      discount,
      total,
      paymentMethod: method,
      storeLocation,
    };

    setLastOrder(orderData);
    setIsPaymentOpen(false);
    setIsTicketOpen(true);
  };

  return (
    <section className="bt-panel flex h-full min-h-[720px] flex-col overflow-hidden">
      <header className="border-b border-[#333333] bg-[#1A3A5F]/18 px-5 py-5 sm:px-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[#94A3B8]">Venta Activa</p>
            <h2 className="mt-3 text-3xl text-white">Carrito de Venta</h2>
          </div>
          <span className="rounded-full border border-[#333333] bg-[#111111] px-3 py-2 font-mono text-xs text-[#E8621A]">
            {items.length} items
          </span>
        </div>

        <div className="mt-4 rounded-[12px] border border-[#333333] bg-[#111111] px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.22em] text-[#94A3B8]">Sucursal operativa</p>
          <p className="mt-2 font-mono text-sm text-white">{storeLocation}</p>
        </div>
      </header>

      <div className="custom-scrollbar flex-1 overflow-y-auto px-5 py-5 sm:px-6">
        {items.length > 0 ? (
          <div className="space-y-3">
            {items.map((item: CartItemSummary) => (
              <article
                key={item.variantId}
                className="rounded-[12px] border border-[#333333] bg-[#111111] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{item.name}</h3>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-[#94A3B8]">
                      Talla {item.size}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.variantId)}
                    className="border-none bg-transparent p-0 text-sm font-semibold uppercase tracking-[0.16em] text-[#9CA3AF] hover:text-[#E8621A]"
                  >
                    Quitar
                  </button>
                </div>

                <div className="mt-5 flex items-end justify-between gap-4">
                  <div className="flex items-center overflow-hidden rounded-[8px] border border-[#333333] bg-[#0F0F0F]">
                    <button
                      type="button"
                      onClick={() => removeOne(item.variantId)}
                      className="border-none bg-transparent px-3 py-2 text-white hover:bg-[#242424]"
                    >
                      -
                    </button>
                    <span className="border-x border-[#333333] px-4 py-2 font-mono text-sm text-white">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => addItem(item, item.stockAvailable)}
                      className="border-none bg-transparent px-3 py-2 text-white hover:bg-[#242424]"
                    >
                      +
                    </button>
                  </div>

                  <p className="font-mono text-lg font-bold text-white">
                    {formatCurrency(item.price * item.quantity)}
                  </p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="flex h-full min-h-[340px] items-center justify-center rounded-[12px] border border-dashed border-[#333333] bg-[#111111] px-6 text-center">
            <div>
              <p className="text-2xl text-white">Sin productos en el carrito</p>
              <p className="mt-3 text-sm text-[#9CA3AF]">
                Agrega productos desde el grid izquierdo para comenzar una venta.
              </p>
            </div>
          </div>
        )}
      </div>

      <footer className="border-t border-[#333333] bg-[#101010] px-5 py-5 sm:px-6">
        <div className="space-y-3 rounded-[12px] border border-[#333333] bg-[#161616] p-4">
          <div className="flex items-center justify-between text-sm text-[#C7CDD4]">
            <span>Subtotal</span>
            <span className="font-mono">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-[#C7CDD4]">
            <span>IVA (16%)</span>
            <span className="font-mono">{formatCurrency(iva)}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-[#C7CDD4]">
            <span>Descuento</span>
            <span className="font-mono">{formatCurrency(discount)}</span>
          </div>
          <div className="flex items-center justify-between border-t border-[#333333] pt-4">
            <span className="text-3xl text-white">TOTAL</span>
            <span className="font-mono text-3xl font-bold text-[#E8621A]">
              {formatCurrency(total)}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsPaymentOpen(true)}
          disabled={items.length === 0}
          className="bt-button-primary mt-4 w-full px-6 py-4 text-sm disabled:cursor-not-allowed disabled:opacity-40"
        >
          Pagar Ahora
        </button>
      </footer>

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
            clearCart();
          }}
          orderData={lastOrder}
        />
      )}
    </section>
  );
}
