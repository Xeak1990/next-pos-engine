"use client";

import { formatCurrency } from "../../lib/utils"; // Usa la utilidad que creamos
import { useCart } from "../../lib/CartContext"; // Importa el hook del carrito

export default function CartPanel() {
  const { items, addItem, removeOne, removeItem, clearCart } = useCart();

  const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const total = subtotal * 1.16;

  return (
    <div className="bg-[#1A1A1A] border-l border-gray-800 h-[calc(100vh-64px)] flex flex-col font-sans">
      <div className="p-6 border-b border-gray-800 flex justify-between items-center">
        <h2 className="text-xl font-bold text-white uppercase tracking-tighter">CARRITO</h2>
        <button onClick={clearCart} className="text-[9px] text-gray-500 hover:text-white uppercase font-bold underline">VACIAR</button>
      </div>

      <div className="flex-grow overflow-y-auto p-4 space-y-2">
        {items.map((item) => (
          <div key={item.variantId} className="bg-[#0F0F0F] p-4 border border-gray-800 flex flex-col gap-3">
            <div className="flex justify-between">
              <span className="text-white font-bold text-xs uppercase">{item.name}</span>
              <button onClick={() => removeItem(item.variantId)} className="text-gray-600 hover:text-red-500">
                &times;
              </button>
            </div>

            <div className="flex justify-between items-center">
              {/* Controles de cantidad */}
              <div className="flex items-center border border-gray-800 bg-[#1A1A1A]">
                <button 
                  onClick={() => removeOne(item.variantId)}
                  className="px-3 py-1 text-gray-400 hover:text-white font-bold"
                >
                  -
                </button>
                <span className="px-3 py-1 text-xs font-bold text-white border-x border-gray-800">
                  {item.quantity}
                </span>
                <button 
                  onClick={() => {
                    // Nota: Aquí necesitarías pasar el stock real. 
                    // Como el carrito no conoce el stock original, lo ideal es limitarlo 
                    // en el addItem del lado del servidor o guardar el stock en el item.
                    addItem(item, 99); 
                  }}
                  className="px-3 py-1 text-gray-400 hover:text-white font-bold"
                >
                  +
                </button>
              </div>
              <span className="text-white font-bold text-sm">
                {formatCurrency(item.price * item.quantity)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Totales */}
      <div className="p-6 bg-[#0F0F0F] border-t border-gray-800">
        <div className="flex justify-between text-[#2ECC71] text-2xl font-bold mb-6">
          <span>TOTAL</span>
          <span>{formatCurrency(total)}</span>
        </div>
        <button 
          className="w-full py-4 bg-[#E8621A] text-white font-bold uppercase text-xs tracking-widest hover:bg-white hover:text-black transition-all"
          disabled={items.length === 0}
        >
          FINALIZAR VENTA
        </button>
      </div>
    </div>
  );
}