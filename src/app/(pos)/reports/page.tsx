"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatCurrency } from "../../../lib/utils";

interface SalesReport {
  totalSales: number;
  totalTransactions: number;
  averageTicket: number;
  salesByStore: Array<{
    store: string;
    sales: number;
    transactions: number;
  }>;
}

export default function ReportsPage() {
  const [report, setReport] = useState<SalesReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReport() {
      try {
        const res = await fetch('/api/reports/sales');
        if (!res.ok) throw new Error("Error en la red");
        const data: SalesReport = await res.json();
        setReport(data);
      } catch (err) {
        console.error("Error cargando reportes:", err);
      } finally {
        setLoading(false);
      }
    }
    loadReport();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <p className="text-white font-mono text-xs animate-pulse">CARGANDO REPORTES...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <p className="text-gray-500 font-bebas text-xl tracking-widest uppercase">
          Error al cargar reportes
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white font-sans p-6">
      {/* Header con botón + POS */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bebas tracking-widest uppercase">
          REPORTES DE VENTAS
        </h1>
        <Link href="/pos/terminal">
          <button className="bg-[#E8621A] text-white px-6 py-3 rounded-[8px] font-bebas text-lg tracking-widest hover:bg-[#FF7A2F] active:scale-[0.97] transition-all">
            + POS
          </button>
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-[#1A1A1A] border border-[#333333] p-6 rounded-[12px] text-center">
          <h3 className="text-lg font-bebas tracking-widest uppercase mb-2">Total Ventas</h3>
          <p className="text-2xl font-mono font-bold text-[#2ECC71]">
            {formatCurrency(report.totalSales)}
          </p>
        </div>
        <div className="bg-[#1A1A1A] border border-[#333333] p-6 rounded-[12px] text-center">
          <h3 className="text-lg font-bebas tracking-widest uppercase mb-2">Transacciones</h3>
          <p className="text-2xl font-mono font-bold text-[#E8621A]">
            {report.totalTransactions}
          </p>
        </div>
        <div className="bg-[#1A1A1A] border border-[#333333] p-6 rounded-[12px] text-center">
          <h3 className="text-lg font-bebas tracking-widest uppercase mb-2">Ticket Promedio</h3>
          <p className="text-2xl font-mono font-bold text-[#F39C12]">
            {formatCurrency(report.averageTicket)}
          </p>
        </div>
      </div>

      {/* Tabla de Ventas por Sucursal */}
      <div className="bg-[#1A1A1A] border border-[#333333] rounded-[12px] overflow-hidden">
        <div className="p-6 border-b border-[#333333]">
          <h2 className="text-xl font-bebas tracking-widest uppercase">
            Ventas por Sucursal
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#0F0F0F]">
              <tr>
                <th className="px-6 py-4 text-left font-bebas text-sm tracking-widest uppercase">Sucursal</th>
                <th className="px-6 py-4 text-left font-bebas text-sm tracking-widest uppercase">Ventas</th>
                <th className="px-6 py-4 text-left font-bebas text-sm tracking-widest uppercase">Transacciones</th>
              </tr>
            </thead>
            <tbody>
              {report.salesByStore.map((store, index) => (
                <tr key={index} className="border-t border-[#333333]">
                  <td className="px-6 py-4 font-mono text-sm">{store.store}</td>
                  <td className="px-6 py-4 font-mono text-sm text-[#2ECC71]">{formatCurrency(store.sales)}</td>
                  <td className="px-6 py-4 font-mono text-sm text-[#E8621A]">{store.transactions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Botón Exportar PDF */}
      <div className="mt-8 text-center">
        <button className="bg-[#E8621A] text-white px-8 py-4 rounded-[8px] font-bebas text-lg tracking-widest hover:bg-[#FF7A2F] active:scale-[0.98] transition-all">
          EXPORTAR PDF
        </button>
      </div>
    </div>
  );
}