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

  const maxDailySales = Math.max(...report.salesTrend.map((point) => point.total), 1);
  const now = new Date();

  return (
    <div className="report-print-area min-h-screen px-4 py-6 text-white sm:px-6 lg:px-8 m-[5px]">
      <div className="space-y-6">
        {/* Header con título estilo Dashboard y botones originales */}
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1
              className="text-[38px] font-[900] uppercase text-white leading-none tracking-tight"
              style={{
                fontFamily: "Arial, sans-serif",
                transform: "scale(0.85, 1.15)",
                transformOrigin: "left center",
                WebkitTextStroke: "1.5px white",
              }}
            >
              Reportes
            </h1>
            <p className="mt-3 text-[16px] font-medium text-[#9CA3AF] lowercase opacity-80">
              {formatLowercaseDate(now)}
            </p>
          </div>

          {/* Botones de filtro y exportación (exactamente iguales al original) */}
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

        {/* Tarjetas KPI (Total Ventas, Transacciones, Ticket Promedio) estilo "VENTAS HOY" */}
        <section className="grid grid-cols-3 gap-[15px]">
          {/* Total Ventas */}
          <article
            className="bt-panel rounded-[22px] flex flex-col shadow-[0_12px_30px_rgba(0,0,0,0.22)] overflow-hidden relative"
            style={{ height: "125px", minHeight: "unset", padding: "0" }}
          >
            <div className="w-[88%] mx-auto pt-4 flex justify-between items-start z-10">
              <p className="text-[12px] font-semibold text-[#9CA3AF] font-sans leading-tight">
                Total Ventas
              </p>
            </div>
            <div className="absolute inset-0 flex items-center justify-start pl-[6%] pointer-events-none">
              <p
                className="text-[26px] font-[900] text-[#2ECC71] uppercase flex items-center h-full"
                style={{
                  fontFamily: "Arial, sans-serif",
                  letterSpacing: "-0.04em",
                  transform: "scaleY(1.35) translateY(15px)",
                  transformOrigin: "center center",
                }}
              >
                {formatCurrency(report.totalSales)}
              </p>
            </div>
            <div className="w-[88%] mx-auto pb-4 mt-auto z-10">
              <p className="text-[11px] font-semibold text-[#9CA3AF] font-sans leading-tight">
                Período seleccionado
              </p>
            </div>
          </article>

          {/* Transacciones */}
          <article
            className="bt-panel rounded-[22px] flex flex-col shadow-[0_12px_30px_rgba(0,0,0,0.22)] overflow-hidden relative"
            style={{ height: "125px", minHeight: "unset", padding: "0" }}
          >
            <div className="w-[88%] mx-auto pt-4 flex justify-between items-start z-10">
              <p className="text-[12px] font-semibold text-[#9CA3AF] font-sans leading-tight">
                Transacciones
              </p>
            </div>
            <div className="absolute inset-0 flex items-center justify-start pl-[6%] pointer-events-none">
              <p
                className="text-[26px] font-[900] text-[#E8621A] uppercase flex items-center h-full"
                style={{
                  fontFamily: "Arial, sans-serif",
                  letterSpacing: "-0.04em",
                  transform: "scaleY(1.35) translateY(15px)",
                  transformOrigin: "center center",
                }}
              >
                {report.totalTransactions}
              </p>
            </div>
            <div className="w-[88%] mx-auto pb-4 mt-auto z-10">
              <p className="text-[11px] font-semibold text-[#9CA3AF] font-sans leading-tight">
                Período seleccionado
              </p>
            </div>
          </article>

          {/* Ticket Promedio */}
          <article
            className="bt-panel rounded-[22px] flex flex-col shadow-[0_12px_30px_rgba(0,0,0,0.22)] overflow-hidden relative"
            style={{ height: "125px", minHeight: "unset", padding: "0" }}
          >
            <div className="w-[88%] mx-auto pt-4 flex justify-between items-start z-10">
              <p className="text-[12px] font-semibold text-[#9CA3AF] font-sans leading-tight">
                Ticket Promedio
              </p>
            </div>
            <div className="absolute inset-0 flex items-center justify-start pl-[6%] pointer-events-none">
              <p
                className="text-[26px] font-[900] text-white uppercase flex items-center h-full"
                style={{
                  fontFamily: "Arial, sans-serif",
                  letterSpacing: "-0.04em",
                  transform: "scaleY(1.35) translateY(15px)",
                  transformOrigin: "center center",
                }}
              >
                {formatCurrency(report.averageTicket)}
              </p>
            </div>
            <div className="w-[88%] mx-auto pb-4 mt-auto z-10">
              <p className="text-[11px] font-semibold text-[#9CA3AF] font-sans leading-tight">
                Período seleccionado
              </p>
            </div>
          </article>
        </section>

        {/* Tarjeta grande: Ventas por sucursal (solo tabla, sin ranking) */}
        <section>
          <article className="bt-panel rounded-[24px] flex flex-col shadow-[0_16px_45px_rgba(0,0,0,0.24)] pt-4 pb-4">
            <div className="w-[88%] mx-auto flex flex-col h-full">
              <h2
                className="mb-4 text-[20px] font-[900] uppercase text-white tracking-tight"
                style={{
                  fontFamily: "Arial, sans-serif",
                  transform: "scale(0.9, 1.1)",
                  transformOrigin: "left center",
                  textShadow: "0 0 1px rgba(255,255,255,0.3)",
                }}
              >
                Ventas por sucursal
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full border-separate border-spacing-y-2">
                  <thead>
                    <tr>
                      <th className="pb-2 text-left font-mono text-[10px] tracking-[0.26em] text-[#8B95A1] uppercase">
                        Sucursal
                      </th>
                      <th className="pb-2 text-right font-mono text-[10px] tracking-[0.26em] text-[#8B95A1] uppercase">
                        Ventas
                      </th>
                      <th className="pb-2 text-right font-mono text-[10px] tracking-[0.26em] text-[#8B95A1] uppercase">
                        Transacciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.salesByStore.map((store, idx) => (
                      <tr key={idx} className="border-b border-[#222222] last:border-0">
                        <td className="py-2 text-left font-sans text-[13px] font-semibold text-white">
                          {store.store}
                        </td>
                        <td className="py-2 text-right font-mono text-[12px] text-[#2ECC71]">
                          {formatCurrency(store.sales)}
                        </td>
                        <td className="py-2 text-right font-mono text-[12px] text-[#E8621A]">
                          {store.transactions}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </article>
        </section>

        {/* Dos columnas: Tendencia y Top productos */}
        <section className="grid grid-cols-2 gap-[15px]">
          {/* Tendencia - Ventas diarias (barras) */}
          <article className="bt-panel rounded-[24px] flex flex-col shadow-[0_16px_45px_rgba(0,0,0,0.24)] pt-4 pb-4">
            <div className="w-[88%] mx-auto flex flex-col h-full">
              <h2
                className="mb-4 text-[20px] font-[900] uppercase text-white tracking-tight"
                style={{
                  fontFamily: "Arial, sans-serif",
                  transform: "scale(0.9, 1.1)",
                  transformOrigin: "left center",
                  textShadow: "0 0 1px rgba(255,255,255,0.3)",
                }}
              >
                Tendencia - Ventas diarias
              </h2>
              <div className="space-y-3">
                {report.salesTrend.map((point) => (
                  <div key={point.date}>
                    <div className="mb-1 flex items-center justify-between gap-3">
                      <span className="font-mono text-[11px] text-[#CBD5E1]">{point.date}</span>
                      <span className="font-mono text-[11px] text-white">
                        {formatCurrency(point.total)}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[#1F1F1F]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#E8621A] to-[#F59E0B]"
                        style={{ width: `${Math.round((point.total / maxDailySales) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </article>

          {/* Top productos más vendidos (tabla) */}
          <article className="bt-panel rounded-[24px] flex flex-col shadow-[0_16px_45px_rgba(0,0,0,0.24)] pt-4 pb-4">
            <div className="w-[88%] mx-auto flex flex-col h-full">
              <h2
                className="mb-4 text-[20px] font-[900] uppercase text-white tracking-tight"
                style={{
                  fontFamily: "Arial, sans-serif",
                  transform: "scale(0.9, 1.1)",
                  transformOrigin: "left center",
                  textShadow: "0 0 1px rgba(255,255,255,0.3)",
                }}
              >
                Top productos más vendidos
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full border-separate border-spacing-y-2">
                  <thead>
                    <tr>
                      <th className="pb-2 text-left font-mono text-[10px] tracking-[0.26em] text-[#8B95A1] uppercase">
                        Modelo
                      </th>
                      <th className="pb-2 text-left font-mono text-[10px] tracking-[0.26em] text-[#8B95A1] uppercase">
                        Talla
                      </th>
                      <th className="pb-2 text-right font-mono text-[10px] tracking-[0.26em] text-[#8B95A1] uppercase">
                        Cant.
                      </th>
                      <th className="pb-2 text-right font-mono text-[10px] tracking-[0.26em] text-[#8B95A1] uppercase">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.topSellers.map((item, idx) => (
                      <tr key={idx} className="border-b border-[#222222] last:border-0">
                        <td className="py-2 text-left font-sans text-[13px] font-semibold text-white">
                          {item.modelName}
                        </td>
                        <td className="py-2 text-left font-mono text-[11px] text-[#CBD5E1]">
                          {item.size}
                        </td>
                        <td className="py-2 text-right font-mono text-[11px] text-[#E8621A]">
                          {item.quantity}
                        </td>
                        <td className="py-2 text-right font-mono text-[11px] text-[#2ECC71]">
                          {formatCurrency(item.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </article>
        </section>
      </div>
    </div>
  );
}