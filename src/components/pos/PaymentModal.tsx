"use client";

import { useState } from "react";
import { formatCurrency } from "../../lib/utils";

interface PaymentModalProps {
  isOpen: boolean;
  total: number;
  onConfirm: (method: string) => void;
  onCancel: () => void;
}

const paymentMethods = [
  { key: "efectivo", label: "Efectivo" },
  { key: "tarjeta", label: "Tarjeta" },
  { key: "transferencia", label: "Transferencia" },
];

export default function PaymentModal({
  isOpen,
  total,
  onConfirm,
  onCancel,
}: PaymentModalProps) {
  const [method, setMethod] = useState("efectivo");

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="bt-panel w-full max-w-lg p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[#94A3B8]">Cobro</p>
            <h2 className="mt-3 text-4xl text-white">Procesar Pago</h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="border-none bg-transparent p-0 text-sm font-semibold uppercase tracking-[0.16em] text-[#9CA3AF] hover:text-white"
          >
            Cerrar
          </button>
        </div>

        <div className="mt-8 rounded-[12px] border border-[#333333] bg-[#111111] p-6 text-center">
          <p className="text-[11px] uppercase tracking-[0.24em] text-[#94A3B8]">Total a cobrar</p>
          <p className="mt-4 font-mono text-4xl font-bold text-[#E8621A]">
            {formatCurrency(total)}
          </p>
        </div>

        <div className="mt-8">
          <p className="text-xs uppercase tracking-[0.28em] text-[#94A3B8]">Metodo de pago</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {paymentMethods.map((paymentMethod) => {
              const isActive = method === paymentMethod.key;

              return (
                <button
                  key={paymentMethod.key}
                  type="button"
                  onClick={() => setMethod(paymentMethod.key)}
                  className={
                    isActive
                      ? "bt-button-secondary flex flex-col items-center gap-2 px-4 py-4 text-xs"
                      : "bt-button-ghost flex flex-col items-center gap-2 px-4 py-4 text-xs"
                  }
                >
                  <span className="font-mono uppercase">{paymentMethod.key.slice(0, 3)}</span>
                  <span>{paymentMethod.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={onCancel} className="bt-button-ghost flex-1 px-5 py-4 text-xs">
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onConfirm(method)}
            className="bt-button-primary flex-1 px-5 py-4 text-xs"
          >
            Confirmar Venta
          </button>
        </div>
      </div>
    </div>
  );
}
