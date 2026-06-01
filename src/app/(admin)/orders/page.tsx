"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatCurrency } from "../../../lib/utils";

type Order = {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  address: string;
  city: string;
  total: number;
  status: string;
  createdAt: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    size?: string;
  }>;
};

function formatLowercaseDate(date: Date) {
  return new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
    .format(date)
    .toLowerCase();
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/orders", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setOrders(data);
        } else {
          console.error("Error fetching orders");
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setOrders((prev) =>
          prev.map((order) =>
            order.id === id ? { ...order, status: newStatus } : order
          )
        );
      } else {
        alert("Error al actualizar el estado");
      }
    } catch (error) {
      console.error(error);
      alert("Error de conexión");
    }
  };

  const now = new Date();
  const formattedDate = formatLowercaseDate(now);

  if (loading) {
    return (
      <div className="w-full min-h-screen px-6 py-8 text-white overflow-y-visible bg-[#060606]">
        <div className="flex items-center justify-center h-64">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-white">
            Cargando pedidos...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen px-6 py-8 text-white overflow-y-visible bg-[#060606]">
      <div className="mx-auto max-w-6xl">
        {/* Cabecera con migas de pan y título */}
        <div className="flex w-full items-start justify-between mb-[15px]">
          <div className="flex flex-col">
            <nav className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#666666]">
              <Link href="/users" className="hover:text-white transition-colors duration-200">
                Administración
              </Link>
              <span>/</span>
              <span className="text-[#e8621a]">Pedidos</span>
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
              Pedidos
            </h1>
            <p className="mt-[-8px] text-[16px] font-medium text-[#9CA3AF] lowercase opacity-80">
              {formattedDate}
            </p>
          </div>
          <div className="flex items-center gap-[5px] mt-1">
            {/* Botones adicionales si se requieren */}
          </div>
        </div>

        {/* Lista de pedidos */}
        <div className="flex flex-col gap-[15px]">
          {orders.map((order) => (
            <div key={order.id} className="bt-panel rounded-2xl overflow-hidden shadow-xl border border-[#333]">
              {/* Cabecera del pedido (información compacta) */}
              <div className="flex flex-wrap justify-between items-start gap-4 p-5 bg-[#0F0F0F] border-b border-[#222]">
                <div>
                  <p className="font-mono text-xs text-[#9CA3AF]">#{order.id.slice(-8).toUpperCase()}</p>
                  <p className="text-xl font-semibold mt-1 text-white">{order.customerName}</p>
                  <p className="text-sm text-[#9CA3AF]">{order.customerEmail}</p>
                  <p className="text-xs text-[#6B7280] mt-1">
                    {new Date(order.createdAt).toLocaleString("es-MX", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-[#2ECC71]">{formatCurrency(order.total)}</p>
                  <div className="flex items-center justify-end gap-2 mt-2">
                    <select
                      value={order.status}
                      onChange={(e) => updateStatus(order.id, e.target.value)}
                      className="rounded-full border border-[#333] bg-[#111] px-3 py-1 text-xs uppercase tracking-wider text-white focus:border-[#E8621A] focus:outline-none"
                      style={{ fontFamily: "Arial, sans-serif" }}
                    >
                      <option value="pending">Pendiente</option>
                      <option value="paid">Pagado</option>
                      <option value="shipped">Enviado</option>
                      <option value="delivered">Entregado</option>
                      <option value="cancelled">Cancelado</option>
                    </select>
                    <button
                      onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                      className="bt-button-ghost px-3 py-1 text-xs rounded-full"
                      style={{ fontFamily: "Arial, sans-serif" }}
                    >
                      {expandedOrder === order.id ? "Ocultar" : "Ver detalles"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Detalles expandidos */}
              {expandedOrder === order.id && (
                <div className="p-5 bg-[#0A0A0A] border-t border-[#222]">
                  <h3 className="text-sm font-semibold text-white mb-3">Productos</h3>
                  <div className="space-y-2">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between text-sm border-b border-[#222] pb-2 last:border-0"
                      >
                        <span className="text-[#D1D5DB]">
                          {item.name} {item.size && `(Talla ${item.size})`} x{item.quantity}
                        </span>
                        <span className="font-mono text-white">
                          {formatCurrency(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 text-sm text-[#D1D5DB] space-y-1">
                    <p>
                      <span className="font-semibold">Dirección:</span> {order.address}, {order.city}
                    </p>
                    {order.customerPhone && (
                      <p>
                        <span className="font-semibold">Teléfono:</span> {order.customerPhone}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
          {orders.length === 0 && (
            <div className="bt-panel rounded-2xl p-8 text-center">
              <p className="text-[#9CA3AF]">No hay pedidos registrados</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}