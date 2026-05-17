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
  { key: "week", label: "Ultimos 7 dias" },
  { key: "month", label: "Este mes" },
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
  return { startDate, endDate };
}

export default function ReportsPage() {
  const [report, setReport] = useState<SalesReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRange, setSelectedRange] = useState<DateRangeKey>("today");

  const handleExport = () => {
    console.log("Exportando...");
    window.print();
  };

  useEffect(() => {
    async function loadReport() {
      setLoading(true);

      try {
        const { startDate, endDate } = getDateRange(selectedRange);
        const params = new URLSearchParams({
          startDate: formatQueryDate(startDate),
          endDate: formatQueryDate(endDate),
        });

        const response = await fetch(`/api/reports/sales?${params.toString()}`);
        if (!response.ok) {
          throw new Error("Error cargando reportes");
        }

        const data: SalesReport = await response.json();
        setReport(data);
      } catch (error) {
        console.error("Error cargando reportes:", error);
        setReport(null);
      } finally {
        setLoading(false);
      }
    }

    loadReport();
  }, [selectedRange]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0F0F0F]">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-white">Cargando reportes...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0F0F0F]">
        <p className="text-2xl text-white">Error al cargar reportes</p>
      </div>
    );
  }

  const maxStoreSales = Math.max(...report.salesByStore.map((store) => store.sales), 1);
  const maxDailySales = Math.max(...report.salesTrend.map((point) => point.total), 1);

  return (
    <div className="report-print-area min-h-screen bg-[#0F0F0F] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="space-y-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.36em] text-[#94A3B8]">Analitica</p>
            <h1 className="mt-3 text-5xl tracking-wider text-white">Reportes</h1>
            <p className="mt-3 text-sm text-[#9CA3AF]">
              Vista consolidada de ventas, sucursales y productos destacados.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {rangeOptions.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setSelectedRange(option.key)}
                className={
                  selectedRange === option.key
                    ? "bt-button-primary px-4 py-3 text-xs"
                    : "bt-button-ghost px-4 py-3 text-xs"
                }
              >
                {option.label}
              </button>
            ))}

            <button
              type="button"
              onClick={handleExport}
              className="bt-button-secondary no-print px-5 py-3 text-xs"
            >
              Exportar PDF
            </button>
          </div>
        </header>

        <section className="grid gap-5 md:grid-cols-3">
          <article className="bt-panel p-5 text-center">
            <p className="text-xs uppercase tracking-[0.28em] text-[#94A3B8]">Total Ventas</p>
            <p className="mt-4 font-mono text-3xl font-bold text-[#2ECC71]">
              {formatCurrency(report.totalSales)}
            </p>
          </article>
          <article className="bt-panel p-5 text-center">
            <p className="text-xs uppercase tracking-[0.28em] text-[#94A3B8]">Transacciones</p>
            <p className="mt-4 font-mono text-3xl font-bold text-[#E8621A]">
              {report.totalTransactions}
            </p>
          </article>
          <article className="bt-panel p-5 text-center">
            <p className="text-xs uppercase tracking-[0.28em] text-[#94A3B8]">Ticket Promedio</p>
            <p className="mt-4 font-mono text-3xl font-bold text-white">
              {formatCurrency(report.averageTicket)}
            </p>
          </article>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <article className="bt-table-shell">
            <div className="border-b border-[#333333] bg-[#1A3A5F]/18 px-6 py-5">
              <p className="text-xs uppercase tracking-[0.28em] text-[#94A3B8]">Sucursales</p>
              <h2 className="mt-3 text-3xl text-white">Ventas por Sucursal</h2>
            </div>

            <div className="custom-scrollbar overflow-x-auto">
              <table className="bt-table min-w-[620px]">
                <thead>
                  <tr>
                    <th>Sucursal</th>
                    <th>Ventas</th>
                    <th>Transacciones</th>
                  </tr>
                </thead>
                <tbody>
                  {report.salesByStore.map((store, index) => (
                    <tr key={`${store.store}-${index}`} className="even:bg-black/10">
                      <td className="font-semibold text-white">{store.store}</td>
                      <td className="font-mono text-[#2ECC71]">{formatCurrency(store.sales)}</td>
                      <td className="font-mono text-[#E8621A]">{store.transactions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <article className="bt-panel p-6">
            <p className="text-xs uppercase tracking-[0.28em] text-[#94A3B8]">Comparativa</p>
            <h2 className="mt-3 text-3xl text-white">Ranking de Sucursales</h2>

            <div className="mt-6 space-y-4">
              {report.salesByStore
                .slice()
                .sort((left, right) => right.sales - left.sales)
                .map((store) => (
                  <div key={store.store}>
                    <div className="mb-2 flex items-center justify-between gap-4">
                      <span className="text-sm font-semibold text-white">{store.store}</span>
                      <span className="font-mono text-sm text-[#2ECC71]">
                        {formatCurrency(store.sales)}
                      </span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-[#1F1F1F]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#1A3A5F] to-[#E8621A]"
                        style={{ width: `${Math.round((store.sales / maxStoreSales) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </article>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <article className="bt-panel p-6">
            <p className="text-xs uppercase tracking-[0.28em] text-[#94A3B8]">Tendencia</p>
            <h2 className="mt-3 text-3xl text-white">Ventas Diarias</h2>

            <div className="mt-6 space-y-4">
              {report.salesTrend.map((point) => (
                <div key={point.date}>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="font-mono text-xs text-[#CBD5E1]">{point.date}</span>
                    <span className="font-mono text-xs text-white">
                      {formatCurrency(point.total)}
                    </span>
                  </div>
                  <div className="h-4 overflow-hidden rounded-full bg-[#1F1F1F]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#E8621A] to-[#F59E0B]"
                      style={{ width: `${Math.round((point.total / maxDailySales) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="bt-table-shell">
            <div className="border-b border-[#333333] bg-[#1A3A5F]/18 px-6 py-5">
              <p className="text-xs uppercase tracking-[0.28em] text-[#94A3B8]">Top productos</p>
              <h2 className="mt-3 text-3xl text-white">Mas Vendidos</h2>
            </div>

            <div className="custom-scrollbar overflow-x-auto">
              <table className="bt-table min-w-[520px]">
                <thead>
                  <tr>
                    <th>Modelo</th>
                    <th>Talla</th>
                    <th className="text-right">Cantidad</th>
                    <th className="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {report.topSellers.map((item, index) => (
                    <tr key={`${item.modelName}-${item.size}-${index}`} className="even:bg-black/10">
                      <td className="font-semibold text-white">{item.modelName}</td>
                      <td className="font-mono">{item.size}</td>
                      <td className="text-right font-mono text-[#E8621A]">{item.quantity}</td>
                      <td className="text-right font-mono text-[#2ECC71]">
                        {formatCurrency(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </section>
      </div>
    </div>
  );
}
