"use client";

import { useState } from "react";
import { formatCurrency } from "../../lib/utils";

interface PaymentModalProps {
  isOpen: boolean;
  total: number;
  onConfirm: (method: string) => void;
  onCancel: () => void;
}

export default function PaymentModal({ isOpen, total, onConfirm, onCancel }: PaymentModalProps) {
  const [method, setMethod] = useState("efectivo");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#1A1A1A] border border-[#333333] w-full max-w-md rounded-[20px] p-8 shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
        <button onClick={onCancel} className="text-gray-500 hover:text-white float-right">✕</button>
        
        <h2 className="text-3xl font-bebas text-white mb-8 tracking-widest">PROCESAR PAGO</h2>
        
        <div className="bg-[#0F0F0F] p-6 rounded-[12px] border border-[#333333] mb-8 text-center">
          <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">TOTAL A COBRAR</p>
          <p className="text-4xl font-mono font-bold text-[#E8621A]">{formatCurrency(total)}</p>
        </div>

        <p className="text-[10px] text-gray-500 font-bold uppercase mb-4">MÉTODO DE PAGO</p>
        <div className="grid grid-cols-3 gap-3 mb-8">
          {["efectivo", "tarjeta", "transferencia"].map((m) => (
            <button
              key={m}
              onClick={() => setMethod(m)}
              className={`py-4 rounded-[12px] border flex flex-col items-center gap-2 transition-all ${
                method === m 
                ? "border-[#E8621A] bg-[#E8621A]/10 text-white" 
                : "border-[#333333] bg-[#0F0F0F] text-gray-500 hover:border-gray-600"
              }`}
            >
              <span className="text-lg">{m === "efectivo" ? "💵" : m === "tarjeta" ? "💳" : "📱"}</span>
              <span className="text-[9px] font-bold uppercase tracking-tighter">{m}</span>
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <button 
            onClick={onCancel}
            className="flex-1 py-4 bg-transparent border border-[#333333] text-gray-500 rounded-[12px] font-bebas tracking-widest hover:bg-white/5"
          >
            CANCELAR
          </button>
          <button 
            onClick={() => onConfirm(method)}
            className="flex-1 py-4 bg-[#2ECC71] text-black rounded-[12px] font-bebas tracking-widest hover:bg-[#27ae60] transition-all"
          >
            CONFIRMAR VENTA
          </button>
        </div>
      </div>
    </div>
  );
}