"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatCurrency } from '../../../../lib/utils';

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
    fetch('/api/orders/customer')
      .then(res => {
        if (!res.ok) throw new Error('No autenticado');
        return res.json();
      })
      .then(data => setOrders(data))
      .catch(() => router.push('/customer/login'))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) return <div className="text-white p-8">Cargando...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-6">Mis pedidos</h1>
      {orders.length === 0 ? (
        <p className="text-[#9CA3AF]">No tienes pedidos aún.</p>
      ) : (
        <div className="space-y-6">
          {orders.map(order => (
            <div key={order.id} className="bt-panel rounded-2xl p-6">
              <div className="flex justify-between items-start flex-wrap gap-2">
                <div>
                  <p className="font-mono text-xs text-[#9CA3AF]">#{order.id}</p>
                  <p className="text-sm text-[#9CA3AF]">{new Date(order.createdAt).toLocaleDateString('es-MX')}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-[#2ECC71]">{formatCurrency(order.total)}</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    order.status === 'delivered' ? 'bg-green-500/20 text-green-400' :
                    order.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                    'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {order.status === 'pending' ? 'Pendiente' :
                     order.status === 'paid' ? 'Pagado' :
                     order.status === 'shipped' ? 'Enviado' :
                     order.status === 'delivered' ? 'Entregado' : 'Cancelado'}
                  </span>
                </div>
              </div>
              <div className="mt-4 border-t border-[#333] pt-4">
                <p className="text-sm font-semibold text-white mb-2">Productos:</p>
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span>{item.name} x{item.quantity}</span>
                    <span>{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="mt-6">
        <Link href="/" className="text-[#E8621A] hover:underline">← Seguir comprando</Link>
      </div>
    </div>
  );
}