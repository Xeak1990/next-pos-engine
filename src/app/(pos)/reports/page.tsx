"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "../../../lib/utils";

type DateRangeKey = "today" | "week" | "month";

interface SalesTrendPoint {
  date: string;
  total: number;
}

interface TopSeller {
  modelName: string;
  size: string;
  quantity: number;
  total: number;
}

interface SalesReport {
  totalSales: number;
  totalTransactions: number;
  averageTicket: number;
  salesByStore: Array<{
    store: string;
    sales: number;
    transactions: number;
  }>;
  topSellers: TopSeller[];
  salesTrend: SalesTrendPoint[];
}

const rangeOptions: Array<{ key: DateRangeKey; label: string }> = [
  { key: "today", label: "Hoy" },
  { key: "week", label: "Últimos 7 días" },
  { key: "month", label: "Este Mes" },
];

function formatQueryDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDateRange(option: DateRangeKey) {
  const now = new Date();
  const endDate = new Date(now);
  endDate.setHours(23, 59, 59, 999);

  const startDate = new Date(now);
  if (option === "week") {
    startDate.setDate(now.getDate() - 6);
  }
  if (option === "month") {
    startDate.setDate(1);
  }

  startDate.setHours(0, 0, 0, 0);
  return {
    startDate,
    endDate,
  };
}

export default function ReportsPage() {
  const [report, setReport] = useState<SalesReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRange, setSelectedRange] = useState<DateRangeKey>("today");

  useEffect(() => {
    async function loadReport() {
      setLoading(true);
      try {
        const { startDate, endDate } = getDateRange(selectedRange);
        const params = new URLSearchParams({
          startDate: formatQueryDate(startDate),
          endDate: formatQueryDate(endDate),
        });

        const res = await fetch(`/api/reports/sales?${params.toString()}`);
        if (!res.ok) throw new Error("Error en la red");
        const data: SalesReport = await res.json();
        setReport(data);
      } catch (err) {
        console.error("Error cargando reportes:", err);
        setReport(null);
      } finally {
        setLoading(false);
      }
    }

    loadReport();
  }, [selectedRange]);

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

  const maxStoreSales = Math.max(...report.salesByStore.map((store) => store.sales), 1);
  const maxDailySales = Math.max(...report.salesTrend.map((point) => point.total), 1);

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white font-sans p-6 report-print-area">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bebas tracking-widest uppercase">REPORTES DE VENTAS</h1>
          <p className="mt-2 text-sm text-gray-400 font-mono uppercase tracking-[0.35em]">
            Rango: {rangeOptions.find((option) => option.key === selectedRange)?.label}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {rangeOptions.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setSelectedRange(option.key)}
              className={`rounded-[8px] px-4 py-2 font-bebas text-sm tracking-widest uppercase transition-all ${
                selectedRange === option.key
                  ? "bg-[#E8621A] text-white"
                  : "bg-[#252525] text-gray-300 hover:bg-[#333333]"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-[#1A1A1A] border border-[#333333] p-6 rounded-[12px] text-center">
          <h3 className="text-lg font-bebas tracking-widest uppercase mb-2">Total Ventas</h3>
          <p className="text-2xl font-mono font-bold text-[#2ECC71]">{formatCurrency(report.totalSales)}</p>
        </div>
        <div className="bg-[#1A1A1A] border border-[#333333] p-6 rounded-[12px] text-center">
          <h3 className="text-lg font-bebas tracking-widest uppercase mb-2">Transacciones</h3>
          <p className="text-2xl font-mono font-bold text-[#E8621A]">{report.totalTransactions}</p>
        </div>
        <div className="bg-[#1A1A1A] border border-[#333333] p-6 rounded-[12px] text-center">
          <h3 className="text-lg font-bebas tracking-widest uppercase mb-2">Ticket Promedio</h3>
          <p className="text-2xl font-mono font-bold text-[#F39C12]">{formatCurrency(report.averageTicket)}</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="bg-[#1A1A1A] border border-[#333333] rounded-[12px] overflow-hidden">
          <div className="p-6 border-b border-[#333333]">
            <h2 className="text-xl font-bebas tracking-widest uppercase">Ventas por Sucursal</h2>
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

        <div className="bg-[#1A1A1A] border border-[#333333] rounded-[12px] p-6">
          <h2 className="text-xl font-bebas tracking-widest uppercase mb-4">Comparativa de Sucursales</h2>
          <div className="space-y-4">
            {report.salesByStore
              .slice()
              .sort((a, b) => b.sales - a.sales)
              .map((store, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bebas uppercase text-sm tracking-widest">{store.store}</span>
                    <span className="font-mono text-sm text-[#2ECC71]">{formatCurrency(store.sales)}</span>
                  </div>
                  <div className="h-3 rounded-full bg-[#262626] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#2ECC71] to-[#27AE60]"
                      style={{ width: `${Math.round((store.sales / maxStoreSales) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr] mt-8">
        <div className="bg-[#1A1A1A] border border-[#333333] rounded-[12px] p-6">
          <div className="mb-4">
            <h2 className="text-xl font-bebas tracking-widest uppercase">Tendencia de Ventas Diarias</h2>
            <p className="text-sm text-gray-400 font-mono mt-1">Visualiza cómo se comporta la venta diaria en el periodo seleccionado.</p>
          </div>
          <div className="space-y-3">
            {report.salesTrend.map((point) => (
              <div key={point.date} className="flex items-center gap-3">
                <span className="w-24 text-xs font-bebas uppercase text-gray-300">{point.date.slice(5)}</span>
                <div className="relative flex-1 h-4 rounded-full bg-[#262626] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#E8621A] to-[#F39C12]"
                    style={{ width: `${Math.round((point.total / maxDailySales) * 100)}%` }}
                  />
                </div>
                <span className="w-24 text-right text-xs font-mono text-gray-200">{formatCurrency(point.total)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#1A1A1A] border border-[#333333] rounded-[12px] overflow-hidden">
          <div className="p-6 border-b border-[#333333]">
            <h2 className="text-xl font-bebas tracking-widest uppercase">Top Productos</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#0F0F0F]">
                <tr>
                  <th className="px-5 py-4 text-left font-bebas text-sm tracking-widest uppercase">Modelo</th>
                  <th className="px-5 py-4 text-left font-bebas text-sm tracking-widest uppercase">Talla</th>
                  <th className="px-5 py-4 text-right font-bebas text-sm tracking-widest uppercase">Cantidad</th>
                  <th className="px-5 py-4 text-right font-bebas text-sm tracking-widest uppercase">Total</th>
                </tr>
              </thead>
              <tbody>
                {report.topSellers.map((item, index) => (
                  <tr key={index} className="border-t border-[#333333]">
                    <td className="px-5 py-4 font-mono text-sm">{item.modelName}</td>
                    <td className="px-5 py-4 font-mono text-sm">{item.size}</td>
                    <td className="px-5 py-4 font-mono text-sm text-[#E8621A] text-right">{item.quantity}</td>
                    <td className="px-5 py-4 font-mono text-sm text-[#2ECC71] text-right">{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center no-print">
        <button
          type="button"
          onClick={() => window.print()}
          className="bg-[#E8621A] text-white px-8 py-4 rounded-[8px] font-bebas text-lg tracking-widest hover:bg-[#FF7A2F] active:scale-[0.98] transition-all"
        >
          EXPORTAR PDF
        </button>
      </div>
    </div>
  );
}
