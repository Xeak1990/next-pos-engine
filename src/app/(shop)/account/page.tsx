"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
}

export default function AccountPage() {
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/customer/me')
      .then(res => {
        if (!res.ok) throw new Error('No autenticado');
        return res.json();
      })
      .then(data => setCustomer(data.customer))
      .catch(() => router.push('/customer/login'))
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/auth/customer/logout', { method: 'POST' });
    router.push('/');
  };

  if (loading) return <div className="text-white p-8">Cargando...</div>;
  if (!customer) return null;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-6">Mi cuenta</h1>
      <div className="bt-panel rounded-2xl p-6 space-y-4">
        <div><span className="text-[#9CA3AF]">Nombre:</span> <span className="text-white">{customer.name}</span></div>
        <div><span className="text-[#9CA3AF]">Email:</span> <span className="text-white">{customer.email}</span></div>
        <div><span className="text-[#9CA3AF]">Teléfono:</span> <span className="text-white">{customer.phone || 'No registrado'}</span></div>
        <div><span className="text-[#9CA3AF]">Dirección:</span> <span className="text-white">{customer.address || 'No registrada'}</span></div>
        <div><span className="text-[#9CA3AF]">Ciudad:</span> <span className="text-white">{customer.city || 'No registrada'}</span></div>
        <div><span className="text-[#9CA3AF]">Código postal:</span> <span className="text-white">{customer.postalCode || 'No registrado'}</span></div>
      </div>
      <div className="mt-6 flex gap-4">
        <Link href="/orders/history" className="bt-button-primary px-6 py-2 rounded-full">Ver pedidos</Link>
        <button onClick={handleLogout} className="bt-button-ghost px-6 py-2 rounded-full">Cerrar sesión</button>
      </div>
    </div>
  );
}