"use client";

import { formatCurrency } from "../../lib/utils";

interface TicketItem {
  name: string;
  size: string;
  price: number;
  quantity: number;
}

interface TicketViewProps {
  folio: string;
  items: TicketItem[];
  subtotal: number;
  iva: number;
  discount?: number;      // nuevo: descuento aplicado (monto)
  total: number;
  paymentMethod: string;
  storeLocation: string;
}

export default function TicketView({
  folio,
  items,
  subtotal,
  iva,
  discount = 0,         // por defecto 0 si no se pasa
  total,
  paymentMethod,
  storeLocation,
}: TicketViewProps) {
  return (
    <div
      className="text-black p-5 w-[380px] font-sans rounded-xl"
      style={{ backgroundColor: "#ffffff", color: "#000000" }}
    >
      <div className="w-[88%] mx-auto">
        {/* Header */}
        <div className="text-center mb-5">
          <h1 className="text-4xl font-bebas tracking-tight leading-none mb-2">BEN TENISON</h1>
          <p className="text-xs font-bold uppercase text-gray-500">{storeLocation}</p>
          <p className="text-[10px] text-gray-500 font-mono mt-1">Teléfono: 228-100-0001</p>
          <p className="text-[10px] text-gray-500 font-mono">Xalapa, Veracruz, Méx.</p>
        </div>

        <div className="border-t border-dashed border-gray-300 pt-5 pb-2 border-0"></div>

        {/* Información de la transacción */}
        <div className="mt-2 mb-4">
          <div className="flex justify-between text-[10px] font-mono uppercase">
            <div className="flex flex-col">
              <span className="text-gray-400">Folio:</span>
              <span className="font-bold text-black text-sm">{folio}</span>
            </div>
            <div className="flex flex-col text-right">
              <span className="text-gray-400">Fecha/Hora</span>
              <span className="font-bold text-black text-[11px]">
                {new Date().toLocaleDateString()} {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-dashed border-gray-300 pt-5 pb-2 border-0"></div>

        {/* Productos */}
        <div className="space-y-4 my-5">
          <div className="flex justify-between text-[9px] font-bold text-gray-400 uppercase border-b pb-1">
            <span>Descripción</span>
            <span>Importe</span>
          </div>
          {items.map((item, index) => (
            <div key={`${folio}-${index}`} className="flex flex-col gap-1">
              <div className="flex justify-between items-start">
                <span className="text-sm font-bold uppercase leading-tight w-3/4">
                  {item.name}
                </span>
                <span className="text-sm font-mono font-bold">
                  {formatCurrency(item.price * item.quantity)}
                </span>
              </div>
              <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                <span>Talla {item.size} x{item.quantity}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Totales con descuento */}
        <div className="border-t border-gray-300 pt-4 space-y-1 font-mono mt-2">
          <div className="flex justify-between text-[11px]">
            <span className="text-gray-500">SUBTOTAL</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-gray-500">IVA 16%</span>
            <span>{formatCurrency(iva)}</span>
          </div>
          {/* Mostrar descuento solo si es mayor a 0 */}
          {discount > 0 && (
            <div className="flex justify-between text-[11px] text-white">
              <span className="text-gray-500">DESCUENTO</span>
              <span>- {formatCurrency(discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-xl font-bold pt-2 border-t border-black/5">
            <span className="font-bebas tracking-wider">TOTAL</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>

        {/* Método de pago */}
        <div className="flex justify-between text-[11px] font-mono mt-5 pt-2">
          <span className="text-gray-500">Método de Pago:</span>
          <span className="font-bold uppercase">{paymentMethod}</span>
        </div>

        {/* Pie del ticket */}
        <div className="mt-6 text-center space-y-4">
          <div className="border-t border-dashed border-gray-300 pt-5 pb-2 border-0 text-gray-500">
            <p className="text-base font-bold uppercase tracking-widest">¡Gracias por tu compra!</p>
            <p className="text-[9px] mt-1 uppercase">
              Es necesario presentar el ticket para tramitar el cambio o devolución
            </p>
          </div>

          <div className="pt-2 text-gray-500">
            <p className="text-sm font-bold font-bebas tracking-[0.2em]">BENTENISON.MX</p>
            <div className="mt-3 flex justify-center opacity-30">
              <div className="h-8 w-48 bg-[repeating-linear-gradient(90deg,black,black_2px,transparent_2px,transparent_4px)]"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}