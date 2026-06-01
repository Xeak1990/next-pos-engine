"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatCurrency } from "../../../../lib/utils";

interface Order {
  id: string;
  total: number;
  status: string;
  createdAt: string;
  items: { name: string; quantity: number; price: number }[];
}

export default function OrderHistoryPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/orders/customer")
      .then((res) => {
        if (!res.ok) throw new Error("No autenticado");
        return res.json();
      })
      .then((data) => setOrders(data))
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  const currentDate = new Date();
  const formattedDate = new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
    .format(currentDate)
    .toLowerCase();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#060606]">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-white">
          Cargando tus pedidos...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen px-6 py-8 text-white overflow-y-visible bg-[#060606]">
      <div className="mx-auto max-w-4xl">
        {/* Cabecera (idéntica a AccountPage) */}
        <div className="flex w-full items-start justify-between mb-[15px]">
          <div className="flex flex-col">
            <nav className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#666666]">
              <Link href="/" className="hover:text-white transition-colors duration-200">
                Catálogo web
              </Link>
              <span>/</span>
              <Link href="/account" className="hover:text-white transition-colors duration-200">
                Mi cuenta
              </Link>
              <span>/</span>
              <span className="text-[#e8621a]">Mis pedidos</span>
            </nav>
            <h1
              className="text-[38px] font-[900] uppercase text-white leading-none tracking-tight"
              style={{
                fontFamily: "Bebas Neue, sans-serif",
                transform: "scale(0.85, 1.15)",
                transformOrigin: "left center",
                WebkitTextStroke: "1.5px white",
                letterSpacing: "0.12em",
              }}
            >
              Mis pedidos
            </h1>
            <p className="mt-[-8px] text-[16px] font-medium text-[#9CA3AF] lowercase opacity-80">
              {formattedDate}
            </p>
          </div>
        </div>

        {/* Contenedor de la tarjeta (ancho configurable) */}
        {/* 👇 CAMBIA EL VALOR DE max-w-[500px] POR EL ANCHO QUE DESEES (ej: max-w-[550px], max-w-[600px], etc.) */}
        <div className="mx-auto max-w-[1500px]">
          <div className="bt-panel rounded-2xl shadow-xl border border-[#333] overflow-hidden">
            <div className="w-[88%] mx-auto pt-6 pb-6">
              {orders.length === 0 ? (
                <div className="text-center">
                  <p className="text-[#9CA3AF] mb-4">No tienes pedidos aún.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {orders.map((order, idx) => (
                    <div key={order.id}>
                      {idx > 0 && <div className="border-t border-dashed border-[#333] my-4" />}
                      <div className="flex flex-wrap justify-between items-start gap-4">
                        <div>
                          <p className="font-mono text-xs text-[#9CA3AF]">
                            Folio: #{order.id.slice(-8).toUpperCase()}
                          </p>
                          <p className="text-sm text-[#9CA3AF] mt-1">
                            {new Date(order.createdAt).toLocaleDateString("es-MX", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-[#2ECC71]">
                            {formatCurrency(order.total)}
                          </p>
                          <span
                            className={`inline-block mt-1 text-xs font-semibold px-3 py-1 rounded-full ${
                              order.status === "delivered"
                                ? "bg-[#2ECC71]/20 text-[#2ECC71]"
                                : order.status === "cancelled"
                                ? "bg-[#E8621A]/20 text-[#E8621A]"
                                : "bg-[#F59E0B]/20 text-[#F59E0B]"
                            }`}
                          >
                            {order.status === "pending"
                              ? "Pendiente"
                              : order.status === "paid"
                              ? "Pagado"
                              : order.status === "shipped"
                              ? "Enviado"
                              : order.status === "delivered"
                              ? "Entregado"
                              : "Cancelado"}
                          </span>
                        </div>
                      </div>
                      <div className="mt-3">
                        <p className="text-sm font-semibold text-white mb-2">Productos</p>
                        <div className="space-y-2">
                          {order.items.map((item, itemIdx) => (
                            <div key={itemIdx} className="flex justify-between text-sm">
                              <span className="text-[#D1D5DB]">
                                {item.name} x{item.quantity}
                              </span>
                              <span className="font-mono text-white">
                                {formatCurrency(item.price * item.quantity)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Botón "Seguir comprando" fuera de la tarjeta, con separación de 10px */}
          <div className="flex justify-center mt-[10px]">
            <Link
              href="/"
              className="bt-button-ghost inline-block px-6 py-2 rounded-full text-xs tracking-[0.18em]"
            >
              ← Seguir comprando
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}