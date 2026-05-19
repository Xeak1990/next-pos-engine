"use client";

import { useEffect, useState } from "react";
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

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/orders");
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

  useEffect(() => {
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
        fetchOrders(); // refrescar
      } else {
        alert("Error al actualizar el estado");
      }
    } catch (error) {
      console.error(error);
      alert("Error de conexión");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-white">Cargando pedidos...</p>
      </div>
    );
  }

  return (
    <div className="text-white">
      <h1 className="text-3xl font-bold mb-6">Gestión de Pedidos</h1>
      <div className="space-y-6">
        {orders.map((order) => (
          <div key={order.id} className="bt-panel rounded-2xl overflow-hidden">
            <div className="p-5 bg-[#0F0F0F] border-b border-[#222] flex flex-wrap justify-between items-start gap-4">
              <div>
                <p className="font-mono text-xs text-[#9CA3AF]">{order.id}</p>
                <p className="text-xl font-semibold mt-1">{order.customerName}</p>
                <p className="text-sm text-[#9CA3AF]">{order.customerEmail}</p>
                <p className="text-xs text-[#6B7280]">
                  {new Date(order.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-[#2ECC71]">
                  {formatCurrency(order.total)}
                </p>
                <select
                  value={order.status}
                  onChange={(e) => updateStatus(order.id, e.target.value)}
                  className="mt-2 rounded-full border border-[#333] bg-[#111] px-3 py-1 text-xs uppercase tracking-wider"
                >
                  <option value="pending">Pendiente</option>
                  <option value="paid">Pagado</option>
                  <option value="shipped">Enviado</option>
                  <option value="delivered">Entregado</option>
                  <option value="cancelled">Cancelado</option>
                </select>
                <button
                  onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                  className="mt-2 ml-3 text-xs text-[#E8621A] hover:underline"
                >
                  {expandedOrder === order.id ? "Ocultar detalles" : "Ver detalles"}
                </button>
              </div>
            </div>
            {expandedOrder === order.id && (
              <div className="p-5 bg-[#0A0A0A] border-t border-[#222]">
                <h3 className="font-semibold mb-3">Productos</h3>
                <div className="space-y-2">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm border-b border-[#222] pb-2">
                      <span>
                        {item.name} {item.size && `(Talla ${item.size})`} x{item.quantity}
                      </span>
                      <span>{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-sm">
                  <p><strong>Dirección:</strong> {order.address}, {order.city}</p>
                  {order.customerPhone && <p><strong>Teléfono:</strong> {order.customerPhone}</p>}
                </div>
              </div>
            )}
          </div>
        ))}
        {orders.length === 0 && (
          <div className="text-center py-12 text-[#9CA3AF]">No hay pedidos registrados</div>
        )}
      </div>
    </div>
  );
}