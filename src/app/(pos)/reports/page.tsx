"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
  const now = new Date();

  const handleExport = () => {
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
      <div className="flex min-h-screen items-center justify-center bg-[#060606]">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-white">
          Cargando reportes...
        </p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#060606]">
        <p className="text-2xl text-white">Error al cargar reportes</p>
      </div>
    );
  }

  const maxDailySales = Math.max(
    ...report.salesTrend.map((point) => point.total),
    1,
  );

  return (
    <div className="w-full min-h-screen bg-[#060606] px-[5px] py-8 text-white overflow-y-visible">
      {/* Estilos de impresión: oculta todo excepto el contenedor de reportes */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #report-content,
          #report-content * {
            visibility: visible;
          }
          #report-content {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            margin: 0;
            padding: 0;
          }
          .no-print {
            display: none !important;
          }
          aside,
          nav:not(#report-content nav),
          header:not(#report-content header) {
            display: none !important;
          }
        }
      `}</style>

      <div id="report-content">
        {/* Cabecera */}
        <div className="flex flex-col">
          <nav className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#666666]">
            <Link
              href="/users"
              className="hover:text-white transition-colors duration-200"
            >
              Administracion
            </Link>
            <span>/</span>
            <span className="text-[#e8621a]">Reportes</span>
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
            Reportes
          </h1>
          <p className="mt-[-8px] text-[16px] font-medium text-[#9CA3AF] lowercase opacity-80">
            {formatLowercaseDate(now)}
          </p>
        </div>

        {/* Botones de filtro - forzado rounded 12px y Arial */}
        {/* Botones de filtro - Aplicado Arial y rounded 12px */}
        <div className="flex flex-wrap gap-[5px] mt-4 mb-[5px] ml-[5px]">
          {rangeOptions.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setSelectedRange(option.key)}
              className={
                selectedRange === option.key
                  ? "bt-button-primary !rounded-[12px] px-4 py-2 text-xs"
                  : "bt-button-ghost !rounded-[12px] px-4 py-2 text-xs"
              }
              style={{
                fontFamily: "Arial, sans-serif",
                borderRadius: "12px",
              }}
            >
              {option.label}
            </button>
          ))}
          <button
            type="button"
            onClick={handleExport}
            className="bt-button-secondary no-print !rounded-[12px] px-5 py-2 text-xs"
            style={{
              fontFamily: "Arial, sans-serif",
              borderRadius: "12px",
            }}
          >
            Exportar PDF
          </button>
        </div>

        {/* Tarjetas KPI - forzado rounded 12px y Arial con !important */}
        <section className="grid grid-cols-3 gap-[7px] mb-[5px]">
          {/* Total Ventas */}
          <article
            className="bt-panel !rounded-[12px] flex flex-col shadow-[0_12px_30px_rgba(0,0,0,0.22)] overflow-hidden relative"
            style={{
              height: "125px",
              minHeight: "unset",
              padding: "0",
              borderRadius: "12px !important",
            }}
          >
            <div className="w-[88%] mx-auto pt-4 flex justify-between items-start z-10">
              <p
                className="text-[12px] font-semibold text-[#9CA3AF] font-sans leading-tight"
                style={{ fontFamily: "Arial, sans-serif !important" }}
              >
                Total Ventas
              </p>
            </div>
            <div className="absolute inset-0 flex items-center justify-start pl-[6%] pointer-events-none">
              <p
                className="text-[26px] font-[900] text-[#2ECC71] uppercase flex items-center h-full"
                style={{
                  fontFamily: "Arial, sans-serif !important",
                  letterSpacing: "-0.04em",
                  transform: "scaleY(1.35) translateY(15px)",
                  transformOrigin: "center center",
                }}
              >
                {formatCurrency(report.totalSales)}
              </p>
            </div>
            <div className="w-[88%] mx-auto pb-4 mt-auto z-10">
              <p
                className="text-[11px] font-semibold text-[#9CA3AF] font-sans leading-tight"
                style={{ fontFamily: "Arial, sans-serif !important" }}
              >
                Período seleccionado
              </p>
            </div>
          </article>

          {/* Transacciones */}
          <article
            className="bt-panel !rounded-[12px] flex flex-col shadow-[0_12px_30px_rgba(0,0,0,0.22)] overflow-hidden relative"
            style={{
              height: "125px",
              minHeight: "unset",
              padding: "0",
              borderRadius: "12px !important",
            }}
          >
            <div className="w-[88%] mx-auto pt-4 flex justify-between items-start z-10">
              <p
                className="text-[12px] font-semibold text-[#9CA3AF] font-sans leading-tight"
                style={{ fontFamily: "Arial, sans-serif !important" }}
              >
                Transacciones
              </p>
            </div>
            <div className="absolute inset-0 flex items-center justify-start pl-[6%] pointer-events-none">
              <p
                className="text-[26px] font-[900] text-[#E8621A] uppercase flex items-center h-full"
                style={{
                  fontFamily: "Arial, sans-serif !important",
                  letterSpacing: "-0.04em",
                  transform: "scaleY(1.35) translateY(15px)",
                  transformOrigin: "center center",
                }}
              >
                {report.totalTransactions}
              </p>
            </div>
            <div className="w-[88%] mx-auto pb-4 mt-auto z-10">
              <p
                className="text-[11px] font-semibold text-[#9CA3AF] font-sans leading-tight"
                style={{ fontFamily: "Arial, sans-serif !important" }}
              >
                Período seleccionado
              </p>
            </div>
          </article>

          {/* Ticket Promedio */}
          <article
            className="bt-panel !rounded-[12px] flex flex-col shadow-[0_12px_30px_rgba(0,0,0,0.22)] overflow-hidden relative"
            style={{
              height: "125px",
              minHeight: "unset",
              padding: "0",
              borderRadius: "12px !important",
            }}
          >
            <div className="w-[88%] mx-auto pt-4 flex justify-between items-start z-10">
              <p
                className="text-[12px] font-semibold text-[#9CA3AF] font-sans leading-tight"
                style={{ fontFamily: "Arial, sans-serif !important" }}
              >
                Ticket Promedio
              </p>
            </div>
            <div className="absolute inset-0 flex items-center justify-start pl-[6%] pointer-events-none">
              <p
                className="text-[26px] font-[900] text-white uppercase flex items-center h-full"
                style={{
                  fontFamily: "Arial, sans-serif !important",
                  letterSpacing: "-0.04em",
                  transform: "scaleY(1.35) translateY(15px)",
                  transformOrigin: "center center",
                }}
              >
                {formatCurrency(report.averageTicket)}
              </p>
            </div>
            <div className="w-[88%] mx-auto pb-4 mt-auto z-10">
              <p
                className="text-[11px] font-semibold text-[#9CA3AF] font-sans leading-tight"
                style={{ fontFamily: "Arial, sans-serif !important" }}
              >
                Período seleccionado
              </p>
            </div>
          </article>
        </section>

        {/* Ventas por sucursal */}
        <section className="mb-[5px]">
          <article
            className="bt-panel !rounded-[12px] flex flex-col shadow-[0_16px_45px_rgba(0,0,0,0.24)] pt-4 pb-4"
            style={{ borderRadius: "12px !important" }}
          >
            <div className="w-[94%] mx-auto flex flex-col h-full">
              <h2
                className="mb-4 text-[20px] font-[900] uppercase text-white tracking-tight"
                style={{
                  fontFamily: "Arial, sans-serif !important",
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
                      <th
                        className="pb-2 text-left font-mono text-[10px] tracking-[0.26em] text-[#8B95A1] uppercase"
                        style={{ fontFamily: "Arial, sans-serif !important" }}
                      >
                        Sucursal
                      </th>
                      <th
                        className="pb-2 text-right font-mono text-[10px] tracking-[0.26em] text-[#8B95A1] uppercase"
                        style={{ fontFamily: "Arial, sans-serif !important" }}
                      >
                        Ventas
                      </th>
                      <th
                        className="pb-2 text-right font-mono text-[10px] tracking-[0.26em] text-[#8B95A1] uppercase"
                        style={{ fontFamily: "Arial, sans-serif !important" }}
                      >
                        Transacciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.salesByStore.map((store, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-[#222222] last:border-0"
                      >
                        <td
                          className="py-2 text-left font-sans text-[13px] font-semibold text-white"
                          style={{ fontFamily: "Arial, sans-serif !important" }}
                        >
                          {store.store}
                        </td>
                        <td
                          className="py-2 text-right font-mono text-[12px] text-[#2ECC71]"
                          style={{ fontFamily: "Arial, sans-serif !important" }}
                        >
                          {formatCurrency(store.sales)}
                        </td>
                        <td
                          className="py-2 text-right font-mono text-[12px] text-[#E8621A]"
                          style={{ fontFamily: "Arial, sans-serif !important" }}
                        >
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

        {/* Tendencia y Top productos */}
        <section className="grid grid-cols-2 gap-[6px] mb-[5px]">
          {/* Tendencia - Ventas diarias */}
          <article
            className="bt-panel !rounded-[12px] flex flex-col shadow-[0_16px_45px_rgba(0,0,0,0.24)] pt-4 pb-4"
            style={{ borderRadius: "12px !important" }}
          >
            <div className="w-[88%] mx-auto flex flex-col h-full">
              <h2
                className="mb-4 text-[20px] font-[900] uppercase text-white tracking-tight"
                style={{
                  fontFamily: "Arial, sans-serif !important",
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
                      <span
                        className="font-mono text-[11px] text-[#CBD5E1]"
                        style={{ fontFamily: "Arial, sans-serif !important" }}
                      >
                        {point.date}
                      </span>
                      <span
                        className="font-mono text-[11px] text-white"
                        style={{ fontFamily: "Arial, sans-serif !important" }}
                      >
                        {formatCurrency(point.total)}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[#1F1F1F]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#E8621A] to-[#F59E0B]"
                        style={{
                          width: `${Math.round((point.total / maxDailySales) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </article>

          {/* Top productos más vendidos */}
          <article
            className="bt-panel !rounded-[12px] flex flex-col shadow-[0_16px_45px_rgba(0,0,0,0.24)] pt-4 pb-4"
            style={{ borderRadius: "12px !important" }}
          >
            <div className="w-[88%] mx-auto flex flex-col h-full">
              <h2
                className="mb-4 text-[20px] font-[900] uppercase text-white tracking-tight"
                style={{
                  fontFamily: "Arial, sans-serif !important",
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
                      <th
                        className="pb-2 text-left font-mono text-[10px] tracking-[0.26em] text-[#8B95A1] uppercase"
                        style={{ fontFamily: "Arial, sans-serif !important" }}
                      >
                        Modelo
                      </th>
                      <th
                        className="pb-2 text-left font-mono text-[10px] tracking-[0.26em] text-[#8B95A1] uppercase"
                        style={{ fontFamily: "Arial, sans-serif !important" }}
                      >
                        Talla
                      </th>
                      <th
                        className="pb-2 text-right font-mono text-[10px] tracking-[0.26em] text-[#8B95A1] uppercase"
                        style={{ fontFamily: "Arial, sans-serif !important" }}
                      >
                        Cant.
                      </th>
                      <th
                        className="pb-2 text-right font-mono text-[10px] tracking-[0.26em] text-[#8B95A1] uppercase"
                        style={{ fontFamily: "Arial, sans-serif !important" }}
                      >
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.topSellers.map((item, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-[#222222] last:border-0"
                      >
                        <td
                          className="py-2 text-left font-sans text-[13px] font-semibold text-white"
                          style={{ fontFamily: "Arial, sans-serif !important" }}
                        >
                          {item.modelName}
                        </td>
                        <td
                          className="py-2 text-left font-mono text-[11px] text-[#CBD5E1]"
                          style={{ fontFamily: "Arial, sans-serif !important" }}
                        >
                          {item.size}
                        </td>
                        <td
                          className="py-2 text-right font-mono text-[11px] text-[#E8621A]"
                          style={{ fontFamily: "Arial, sans-serif !important" }}
                        >
                          {item.quantity}
                        </td>
                        <td
                          className="py-2 text-right font-mono text-[11px] text-[#2ECC71]"
                          style={{ fontFamily: "Arial, sans-serif !important" }}
                        >
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
