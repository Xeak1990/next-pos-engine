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
  const [discountValue, setDiscountValue] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");

  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const iva = subtotal * 0.16;
  const baseForDiscount = subtotal + iva;

  let discountAmount = 0;
  const rawValue = parseFloat(discountValue);
  const isValid = !isNaN(rawValue) && rawValue >= 0;

  if (isValid) {
    if (discountType === "percentage") {
      const percent = Math.min(100, rawValue);
      discountAmount = baseForDiscount * (percent / 100);
    } else {
      discountAmount = Math.min(baseForDiscount, rawValue);
    }
  }

  const total = baseForDiscount - discountAmount;

  const handleProcessPayment = (method: string) => {
    const orderData: OrderSummary = {
      folio: generateFolio(),
      items,
      subtotal,
      iva,
      discount: discountAmount,
      total,
      paymentMethod: method,
      storeLocation,
    };
    setLastOrder(orderData);
    setIsPaymentOpen(false);
    setIsTicketOpen(true);
  };

  return (
    <section className="bt-panel flex flex-col overflow-hidden bg-[#111111] h-full max-h-full">
      <div className="w-[95%] mx-auto flex flex-col h-full">
        <header className="border-b border-[#333333] py-3 flex-shrink-0">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[#94A3B8]">Venta Activa</p>
            <h2 className="mt-3 text-3xl tracking-wider text-white">Carrito de Venta</h2>
            <div className="mt-2 mb-[10px]">
              <span className="inline-block rounded-[5px] border border-[#333333] bg-[#111111] px-3 py-2 font-mono text-xs text-[#E8621A]">
                {items.length} items
              </span>
            </div>
          </div>
          <div className="mt-4 mb-[10px] rounded-[12px] border border-[#333333] bg-[#111111] px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.22em] text-[#94A3B8]">Sucursal operativa</p>
            <p className="mt-2 font-mono text-sm text-white">{storeLocation}</p>
          </div>
        </header>

        {/* Lista de productos – con scroll interno */}
        <div className="custom-scrollbar flex-1 overflow-y-auto py-[5px] min-h-0">
          {items.length > 0 ? (
            <div className="space-y-[5px]">
              {items.map((item: CartItemSummary) => (
                <article key={item.variantId} className="rounded-[12px] bg-[#111111] p-4">
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
                      style={{ fontFamily: "Arial, sans-serif" }}
                    >
                      Quitar
                    </button>
                  </div>
                  <div className="mt-5 flex items-end justify-between gap-4">
                    <div className="flex items-center overflow-hidden rounded-[8px] border border-[#333333] bg-[#0F0F0F]">
                      <button
                        type="button"
                        onClick={() => removeOne(item.variantId)}
                        style={{
                          background: "transparent",
                          color: "white",
                          border: "none",
                          padding: "7px 7px",
                          cursor: "pointer",
                        }}
                        className="hover:bg-[#242424]"
                      >
                        -
                      </button>
                      <span className="border-x border-[#333333] px-4 py-2 font-mono text-sm text-white">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => addItem(item, item.stockAvailable)}
                        style={{
                          background: "transparent",
                          color: "white",
                          border: "none",
                          padding: "7px 7px",
                          cursor: "pointer",
                        }}
                        className="hover:bg-[#242424]"
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
            <div className="flex h-full items-center justify-center rounded-[12px] border border-dashed border-[#333333] bg-[#111111] px-6 text-center">
              <div>
                <p className="text-2xl text-white">Sin productos en el carrito</p>
                <p className="mt-3 text-sm text-[#9CA3AF]">
                  Agrega productos desde el grid izquierdo para comenzar una venta.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer con el resumen y botones – fijo abajo */}
        <footer className="py-[5px] flex-shrink-0">
          <div className="rounded-[12px] border border-[#333333] bg-[#1A1A1A]">
            <div className="w-[95%] mx-auto py-[5px] space-y-[5px]">
              <div className="flex items-center justify-between text-sm text-[#9CA3AF]">
                <span>Subtotal</span>
                <span className="font-mono">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-[#9CA3AF]">
                <span>IVA (16%)</span>
                <span className="font-mono">{formatCurrency(iva)}</span>
              </div>

              <div className="flex items-center justify-between gap-2 text-sm text-[#9CA3AF]">
                <div className="flex items-center gap-2">
                  <span style={{ fontFamily: "Arial, sans-serif" }}>Descuento</span>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as "percentage" | "fixed")}
                    className="bg-[#0F0F0F] border border-[#333333] rounded-[8px] px-2 py-1 text-xs text-white"
                    style={{ fontFamily: "Arial, sans-serif" }}
                  >
                    <option value="percentage">%</option>
                    <option value="fixed">$</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    step={discountType === "percentage" ? "1" : "10"}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    className="w-24 text-right border border-[#333333] bg-[#0F0F0F] px-3 py-1 text-sm text-white rounded-[8px]"
                    style={{ fontFamily: "Arial, sans-serif" }}
                    placeholder={discountType === "percentage" ? "%" : "$"}
                  />
                </div>
              </div>

              {discountAmount > 0 && (
                <div className="flex items-center justify-between text-xs text-[#E8621A]">
                  <span>Descuento aplicado:</span>
                  <span className="font-mono">-{formatCurrency(discountAmount)}</span>
                </div>
              )}

              <div className="flex items-center justify-between border-t border-[#333333] pt-2">
                <span className="text-3xl tracking-wider text-white uppercase">TOTAL</span>
                <span className="font-mono text-3xl font-bold text-[#E8621A]">
                  {formatCurrency(total)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-[10px] mb-[5px] pt-2">
                <button
                  type="button"
                  onClick={() => {
                    clearCart();
                    setDiscountValue("");
                  }}
                  disabled={items.length === 0}
                  className="bt-button-ghost w-full px-6 py-4 text-sm disabled:cursor-not-allowed disabled:opacity-40 rounded-[10px]"
                  style={{ fontFamily: "Arial, sans-serif" }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => setIsPaymentOpen(true)}
                  disabled={items.length === 0 || total < 0}
                  className="bt-button-primary w-full px-6 py-4 text-sm disabled:cursor-not-allowed disabled:opacity-40 !rounded-[10px]"
                  style={{ fontFamily: "Arial, sans-serif" }}
                >
                  Pagar
                </button>
              </div>
            </div>
          </div>
        </footer>
      </div>

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