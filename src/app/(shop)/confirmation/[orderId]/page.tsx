"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { formatCurrency } from "../../../../lib/utils";

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  size: string | null;
}

interface Order {
  id: string;
  total: number;
  items: OrderItem[];
}

const TICKET_WIDTH_PX = 600;

export default function ConfirmationPage() {
  const params = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const orderId = params.orderId;

  useEffect(() => {
    if (!orderId) return;
    fetch(`/api/orders/${orderId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Pedido no encontrado");
        return res.json();
      })
      .then((data) => setOrder(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) {
    return (
      <div className="w-full min-h-screen px-6 py-8 text-white overflow-y-visible bg-[#060606]">
        <div className="flex items-center justify-center h-64">
          <p className="text-white text-lg">Cargando pedido...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="w-full min-h-screen px-6 py-8 text-white overflow-y-visible bg-[#060606]">
        <div className="mx-auto max-w-md text-center">
          <div className="bt-panel rounded-2xl p-6 shadow-xl border border-[#333]">
            <p className="text-red-400 mb-4">No se pudo encontrar el pedido.</p>
            <Link
              href="/"
              className="bt-button-primary inline-block py-2 px-4 rounded-full text-xs tracking-[0.18em]"
            >
              Volver al catálogo
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const subtotal = order.total / 1.16;
  const iva = order.total - subtotal;
  const deliveryMethod = "Recoger en tienda"; // Puedes leerlo de la orden si lo guardaste
  const storeName = "Tienda Centro";

  return (
    <div className="w-full min-h-screen px-6 py-8 text-white overflow-y-visible bg-[#060606]">
      <div className="mx-auto max-w-md">
        <div
          className="bt-panel rounded-[88px] p-6 shadow-xl border border-[#333] mx-auto"
          style={{ width: `${TICKET_WIDTH_PX}px`, maxWidth: "90%" }}
        >
          <div className="w-[88%] mx-auto">
            <div className="text-center mb-4">
              <h1
                className="text-3xl font-[900] uppercase text-white leading-none tracking-tight inline-block"
                style={{
                  fontFamily: "Bebas Neue, sans-serif",
                  transform: "scale(0.85, 1.15)",
                  transformOrigin: "center",
                  WebkitTextStroke: "1px white",
                  letterSpacing: "0.12em",
                }}
              >
                ¡Gracias!
              </h1>
            </div>
            <div className="text-center mb-6">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#2ECC71]/20 mb-3">
                <svg className="h-7 w-7 text-[#2ECC71]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white">¡Pedido confirmado!</h2>
              <p className="text-xs text-[#6B7280] mt-1">Folio: #{order.id.slice(-8)}</p>
            </div>
            <div className="border-t border-dashed border-[#333] my-4"></div>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-[#D1D5DB]">
                    {item.name} {item.size && `(Talla ${item.size})`} x{item.quantity}
                  </span>
                  <span className="font-mono text-white">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t border-[#333] my-4"></div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-[#9CA3AF]">Subtotal</span>
                <span className="font-mono">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9CA3AF]">IVA (16%)</span>
                <span className="font-mono">{formatCurrency(iva)}</span>
              </div>
              <div className="border-t border-[#333] pt-2 mt-2">
                <div className="flex justify-between font-bold text-white text-lg">
                  <span>Total</span>
                  <span className="font-mono">{formatCurrency(order.total)}</span>
                </div>
              </div>
            </div>
            <div className="border-t border-dashed border-[#333] my-4"></div>
            <div className="text-sm">
              <p className="text-[#9CA3AF] uppercase tracking-wider text-xs mb-1">Método de entrega</p>
              <p className="text-white font-medium">{deliveryMethod}</p>
              {deliveryMethod === "Recoger en tienda" && (
                <p className="text-xs text-[#6B7280] mt-1">Sucursal: {storeName}</p>
              )}
            </div>
            <div className="border-t border-dashed border-[#333] my-4"></div>
            <div className="text-center text-xs text-[#6B7280] space-y-1">
              <p>Ben Tenison - Tu tienda de confianza</p>
              <p>Para cualquier duda, contacta a soporte@bentenison.mx</p>
            </div>
          </div>
        </div>
        <div className="mt-[15px] text-center">
          <Link
            href="/"
            className="bt-button-primary inline-block w-full max-w-[200px] py-2 text-center rounded-full text-xs tracking-[0.18em]"
            style={{ fontFamily: "Arial, sans-serif" }}
          >
            Seguir comprando
          </Link>
        </div>
      </div>
    </div>
  );
}