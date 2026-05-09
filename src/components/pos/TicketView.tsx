"use client";

import { formatCurrency } from "../../lib/utils";

// Definimos la interfaz estricta (sin 'any')
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
  total: number;
  paymentMethod: string;
  storeLocation: string;
}

export default function TicketView({
  folio,
  items,
  subtotal,
  iva,
  total,
  paymentMethod,
  storeLocation,
}: TicketViewProps) {
  return (
    <div className="bg-white text-black p-4 w-full max-w-sm mx-auto shadow-sm print:shadow-none font-sans">
      {/* Header Estilo Ben Tenison */}
      <div className="text-center mb-6">
        <h1 className="text-4xl font-bebas tracking-tight leading-none mb-1">BEN TENISON</h1>
        <p className="text-[10px] font-bold uppercase text-gray-700">{storeLocation}</p>
        <p className="text-[9px] text-gray-500 font-mono mt-1">Xalapa, Veracruz, Méx.</p>
      </div>

      {/* Divisor Punteado (Estética de papel térmico) */}
      <div className="border-t-2 border-dashed border-gray-300 my-4"></div>

      {/* Información de la Transacción (RF09) */}
      <div className="flex justify-between text-[10px] font-mono mb-6 uppercase">
        <div className="flex flex-col">
          <span className="text-gray-400">Folio de Venta</span>
          <span className="font-bold text-black">{folio}</span>
        </div>
        <div className="flex flex-col text-right">
          <span className="text-gray-400">Fecha y Hora</span>
          <span className="font-bold text-black">
            {new Date().toLocaleDateString()} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      {/* Listado de Productos */}
      <div className="space-y-4 mb-8">
        <div className="flex justify-between text-[9px] font-bold text-gray-400 uppercase border-b pb-1">
          <span>Descripción</span>
          <span>Importe</span>
        </div>
        
        {items.map((item, index) => (
          <div key={`${folio}-${index}`} className="flex flex-col">
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-bold uppercase leading-tight w-3/4">
                {item.name}
              </span>
              <span className="text-[11px] font-mono font-bold">
                {formatCurrency(item.price * item.quantity)}
              </span>
            </div>
            <div className="flex justify-between text-[9px] text-gray-500 font-mono">
              <span>Talla: {item.size} x{item.quantity}</span>
              <span>@{formatCurrency(item.price)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Totales y Desglose (RF06) */}
      <div className="border-t border-gray-200 pt-4 space-y-1.5 font-mono">
        <div className="flex justify-between text-[11px]">
          <span className="text-gray-500">SUBTOTAL</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between text-[11px]">
          <span className="text-gray-500">IVA (16%)</span>
          <span>{formatCurrency(iva)}</span>
        </div>
        <div className="flex justify-between text-xl font-bold pt-2 border-t border-black/5">
          <span className="font-bebas tracking-wider">TOTAL</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>

      {/* Pie de Ticket */}
      <div className="mt-8 text-center space-y-4">
        <div className="text-[10px] font-mono italic uppercase text-gray-600">
          Método de Pago: {paymentMethod}
        </div>
        
        <div className="border-t-2 border-dashed border-gray-300 pt-6 pb-2">
          <p className="text-[11px] font-bold uppercase tracking-widest">¡Gracias por tu compra!</p>
          <p className="text-[9px] text-gray-400 mt-1 uppercase">
            No se aceptan devoluciones sin este comprobante
          </p>
        </div>

        {/* Branding Final */}
        <div className="pt-2">
          <p className="text-[10px] font-bold text-[#E8621A] font-bebas tracking-[0.2em]">BENTENISON.MX</p>
          <div className="mt-2 flex justify-center opacity-30">
             {/* Simulación de código de barras */}
             <div className="h-8 w-48 bg-[repeating-linear-gradient(90deg,black,black_2px,transparent_2px,transparent_4px)]"></div>
          </div>
        </div>
      </div>
    </div>
  );
}