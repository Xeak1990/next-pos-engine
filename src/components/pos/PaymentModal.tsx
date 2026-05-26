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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[#1A1A1A] rounded-[24px] shadow-xl border border-gray-600">
        {/* Padding vertical aumentado a 30px y separación entre secciones de 10px */}
        <div className="w-[90%] mx-auto py-[30px] space-y-[10px]">
          {/* Cabecera del modal */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[#94A3B8]" style={{ fontFamily: "Arial, sans-serif" }}>
                Cobro
              </p>
              <h2 className="mt-1 text-4xl text-white" style={{ fontFamily: "Arial, sans-serif" }}>
                Procesar Pago
              </h2>
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="bt-button-ghost px-2 py-2 text-xs"
              style={{ fontFamily: "Arial, sans-serif" }}
            >
              Cerrar
            </button>
          </div>

          {/* Total a cobrar */}
          <div className="rounded-[12px] border border-[#333333] bg-[#111111] p-6 text-center">
            <p className="text-[11px] uppercase tracking-[0.24em] text-[#94A3B8]" style={{ fontFamily: "Arial, sans-serif" }}>
              Total a cobrar
            </p>
            <p className="mt-4 font-mono text-4xl font-bold text-[#E8621A]" style={{ fontFamily: "Arial, sans-serif" }}>
              {formatCurrency(total)}
            </p>
          </div>

          {/* Método de pago */}
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[#94A3B8]" style={{ fontFamily: "Arial, sans-serif" }}>
              Método de pago
            </p>
            <div className="mt-4 grid gap-[10px] sm:grid-cols-3">
              {paymentMethods.map((paymentMethod) => {
                const isActive = method === paymentMethod.key;
                return (
                  <button
                    key={paymentMethod.key}
                    type="button"
                    onClick={() => setMethod(paymentMethod.key)}
                    className={
                      isActive
                        ? "bt-button-secondary flex items-center justify-center px-4 py-3 text-xs normal-case"
                        : "bt-button-ghost flex items-center justify-center px-4 py-3 text-xs normal-case"
                    }
                    style={{ fontFamily: "Arial, sans-serif" }}
                  >
                    {paymentMethod.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Botones de acción */}
          <div className="grid grid-cols-2 gap-[10px] pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="bt-button-ghost px-6 py-3 text-xs"
              style={{ fontFamily: "Arial, sans-serif" }}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => onConfirm(method)}
              className="bt-button-primary px-6 py-3 text-xs"
              style={{ fontFamily: "Arial, sans-serif" }}
            >
              Confirmar Venta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}