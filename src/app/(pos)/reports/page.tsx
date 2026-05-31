import Link from "next/link";
import { cookies } from "next/headers";
import { prisma } from "../../../lib/prisma";
import { verifyAuthToken } from "../../../lib/token-utils";
import { formatCurrency } from "../../../lib/utils";

type DateRangeKey = "today" | "week" | "month" | "last60";

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
  } else if (option === "month") {
    startDate.setDate(1);
  } else if (option === "last60") {
    startDate.setDate(now.getDate() - 59);
  }
  startDate.setHours(0, 0, 0, 0);
  return { startDate, endDate };
}

const rangeOptions: Array<{ key: DateRangeKey; label: string }> = [
  { key: "today", label: "Hoy" },
  { key: "week", label: "Últimos 7 días" },
  { key: "month", label: "Este mes" },
  { key: "last60", label: "Últimos 60 días" },
];

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range = "last60" } = await searchParams;
  const selectedRange = range as DateRangeKey;

  // Autenticación
  const cookieStore = await cookies();
  const token = cookieStore.get("bt_auth")?.value;
  const authPayload = token ? await verifyAuthToken(token) : null;
  if (!authPayload || (authPayload.role !== "ADMIN" && authPayload.role !== "MANAGER")) {
    return <div className="p-8 text-white">Acceso denegado</div>;
  }

  const { startDate, endDate } = getDateRange(selectedRange);
  const dateFilter = { createdAt: { gte: startDate, lte: endDate } };

  // Totales
  const totalAgg = await prisma.sale.aggregate({
    where: dateFilter,
    _sum: { total: true },
    _count: true,
  });
  const totalSales = Number(totalAgg._sum.total || 0);
  const totalTransactions = totalAgg._count;
  const averageTicket = totalTransactions > 0 ? totalSales / totalTransactions : 0;

  // Ventas por sucursal
  const salesByStoreRaw = await prisma.sale.groupBy({
    by: ["storeId"],
    where: dateFilter,
    _sum: { total: true },
    _count: true,
  });
  const storeIds = salesByStoreRaw.map(s => s.storeId);
  const stores = await prisma.store.findMany({
    where: { id: { in: storeIds } },
    select: { id: true, name: true },
  });
  const storeMap = Object.fromEntries(stores.map(s => [s.id, s.name]));
  const salesByStore = salesByStoreRaw.map(s => ({
    store: storeMap[s.storeId] || "Desconocido",
    sales: Number(s._sum.total || 0),
    transactions: s._count,
  }));

  // Top productos
  const saleItems = await prisma.saleItem.findMany({
    where: { sale: dateFilter },
    select: {
      quantity: true,
      salePrice: true,
      variant: {
        select: {
          size: true,
          product: { select: { name: true } },
        },
      },
    },
  });
  const topMap = new Map<string, { modelName: string; size: string; quantity: number; total: number }>();
  for (const item of saleItems) {
    const key = `${item.variant.product.name}-${item.variant.size}`;
    const qty = item.quantity;
    const total = Number(item.salePrice) * qty;
    const existing = topMap.get(key);
    if (existing) {
      existing.quantity += qty;
      existing.total += total;
    } else {
      topMap.set(key, {
        modelName: item.variant.product.name,
        size: item.variant.size,
        quantity: qty,
        total,
      });
    }
  }
  const topSellers = Array.from(topMap.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  // Tendencia diaria (con todos los días del rango, incluso sin ventas)
  const allSales = await prisma.sale.findMany({
    where: dateFilter,
    select: { total: true, createdAt: true },
  });
  const trendMap = new Map<string, number>();
  for (const sale of allSales) {
    const dateKey = formatQueryDate(sale.createdAt);
    trendMap.set(dateKey, (trendMap.get(dateKey) || 0) + Number(sale.total));
  }
  const salesTrend = [];
  const current = new Date(startDate);
  while (current <= endDate) {
    const key = formatQueryDate(current);
    salesTrend.push({ date: key, total: trendMap.get(key) || 0 });
    current.setDate(current.getDate() + 1);
  }

  // 🔁 FILTRAR: solo días con ventas > 0 para la visualización
  const filteredSalesTrend = salesTrend.filter(point => point.total > 0);
  const maxDailySales = filteredSalesTrend.length > 0
    ? Math.max(...filteredSalesTrend.map(p => p.total), 1)
    : 1;

  const hasSales = totalTransactions > 0;
  const now = new Date();

  return (
    <div className="flex-1 min-h-screen max-w-full bg-[#060606] px-6 py-8 text-white overflow-hidden m-[5px]">
      <div className="flex w-full items-start justify-between mb-[15px]">
        <div className="flex flex-col">
          <nav className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#666666]">
            <Link href="/users" className="hover:text-white transition-colors duration-200">Administracion</Link>
            <span>/</span>
            <span className="text-[#e8621a]">Reportes</span>
          </nav>
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
          <p className="mt-[-8px] text-[16px] font-medium text-[#9CA3AF] lowercase opacity-80">
            {formatLowercaseDate(now)}
          </p>
        </div>
        <div className="flex items-center gap-[5px] mt-1">
          {/* Botones adicionales si se requieren */}
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-[5px] mt-4 mb-[5px] ml-[5px]">
        {rangeOptions.map((option) => (
          <Link
            key={option.key}
            href={`/reports?range=${option.key}`}
            className={selectedRange === option.key
              ? "bt-button-primary !rounded-[12px] px-4 py-2 text-xs"
              : "bt-button-ghost !rounded-[12px] px-4 py-2 text-xs"}
            style={{ fontFamily: "Arial, sans-serif", borderRadius: "12px" }}
          >
            {option.label}
          </Link>
        ))}
      </div>

      {/* Tarjetas KPI (sin cambios) */}
      <section className="grid grid-cols-3 gap-[7px] mb-[5px]">
        {/* Total Ventas */}
        <article className="bt-panel !rounded-[12px] flex flex-col shadow-[0_12px_30px_rgba(0,0,0,0.22)] overflow-hidden relative" style={{ height: "125px", minHeight: "unset", padding: "0", borderRadius: "12px !important" }}>
          <div className="w-[88%] mx-auto pt-4 flex justify-between items-start z-10">
            <p className="text-[12px] font-semibold text-[#9CA3AF] font-sans leading-tight" style={{ fontFamily: "Arial, sans-serif !important" }}>Total Ventas</p>
          </div>
          <div className="absolute inset-0 flex items-center justify-start pl-[6%] pointer-events-none">
            <p className="text-[26px] font-[900] text-[#2ECC71] uppercase flex items-center h-full" style={{ fontFamily: "Arial, sans-serif !important", letterSpacing: "-0.04em", transform: "scaleY(1.35) translateY(15px)", transformOrigin: "center center" }}>
              {formatCurrency(totalSales)}
            </p>
          </div>
          <div className="w-[88%] mx-auto pb-4 mt-auto z-10">
            <p className="text-[11px] font-semibold text-[#9CA3AF] font-sans leading-tight" style={{ fontFamily: "Arial, sans-serif !important" }}>Período seleccionado</p>
          </div>
        </article>

        {/* Transacciones */}
        <article className="bt-panel !rounded-[12px] flex flex-col shadow-[0_12px_30px_rgba(0,0,0,0.22)] overflow-hidden relative" style={{ height: "125px", minHeight: "unset", padding: "0", borderRadius: "12px !important" }}>
          <div className="w-[88%] mx-auto pt-4 flex justify-between items-start z-10">
            <p className="text-[12px] font-semibold text-[#9CA3AF] font-sans leading-tight" style={{ fontFamily: "Arial, sans-serif !important" }}>Transacciones</p>
          </div>
          <div className="absolute inset-0 flex items-center justify-start pl-[6%] pointer-events-none">
            <p className="text-[26px] font-[900] text-[#E8621A] uppercase flex items-center h-full" style={{ fontFamily: "Arial, sans-serif !important", letterSpacing: "-0.04em", transform: "scaleY(1.35) translateY(15px)", transformOrigin: "center center" }}>
              {totalTransactions}
            </p>
          </div>
          <div className="w-[88%] mx-auto pb-4 mt-auto z-10">
            <p className="text-[11px] font-semibold text-[#9CA3AF] font-sans leading-tight" style={{ fontFamily: "Arial, sans-serif !important" }}>Período seleccionado</p>
          </div>
        </article>

        {/* Ticket Promedio */}
        <article className="bt-panel !rounded-[12px] flex flex-col shadow-[0_12px_30px_rgba(0,0,0,0.22)] overflow-hidden relative" style={{ height: "125px", minHeight: "unset", padding: "0", borderRadius: "12px !important" }}>
          <div className="w-[88%] mx-auto pt-4 flex justify-between items-start z-10">
            <p className="text-[12px] font-semibold text-[#9CA3AF] font-sans leading-tight" style={{ fontFamily: "Arial, sans-serif !important" }}>Ticket Promedio</p>
          </div>
          <div className="absolute inset-0 flex items-center justify-start pl-[6%] pointer-events-none">
            <p className="text-[26px] font-[900] text-white uppercase flex items-center h-full" style={{ fontFamily: "Arial, sans-serif !important", letterSpacing: "-0.04em", transform: "scaleY(1.35) translateY(15px)", transformOrigin: "center center" }}>
              {formatCurrency(averageTicket)}
            </p>
          </div>
          <div className="w-[88%] mx-auto pb-4 mt-auto z-10">
            <p className="text-[11px] font-semibold text-[#9CA3AF] font-sans leading-tight" style={{ fontFamily: "Arial, sans-serif !important" }}>Período seleccionado</p>
          </div>
        </article>
      </section>

      {/* Ventas por sucursal */}
      <section className="mb-[5px]">
        <article className="bt-panel !rounded-[12px] flex flex-col shadow-[0_16px_45px_rgba(0,0,0,0.24)] pt-4 pb-4" style={{ borderRadius: "12px !important" }}>
          <div className="w-[94%] mx-auto flex flex-col h-full">
            <h2 className="mb-4 text-[20px] font-[900] uppercase text-white tracking-tight" style={{ fontFamily: "Arial, sans-serif !important", transform: "scale(0.9, 1.1)", transformOrigin: "left center", textShadow: "0 0 1px rgba(255,255,255,0.3)" }}>
              Ventas por sucursal
            </h2>
            <div className="overflow-x-auto">
              {hasSales && salesByStore.length > 0 ? (
                <table className="w-full border-separate border-spacing-y-2">
                  <thead>
                    <tr>
                      <th className="pb-2 text-left font-mono text-[10px] tracking-[0.26em] text-[#8B95A1] uppercase" style={{ fontFamily: "Arial, sans-serif !important" }}>Sucursal</th>
                      <th className="pb-2 text-right font-mono text-[10px] tracking-[0.26em] text-[#8B95A1] uppercase" style={{ fontFamily: "Arial, sans-serif !important" }}>Ventas</th>
                      <th className="pb-2 text-right font-mono text-[10px] tracking-[0.26em] text-[#8B95A1] uppercase" style={{ fontFamily: "Arial, sans-serif !important" }}>Transacciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesByStore.map((store, idx) => (
                      <tr key={idx} className="border-b border-[#222222] last:border-0">
                        <td className="py-2 text-left font-sans text-[13px] font-semibold text-white" style={{ fontFamily: "Arial, sans-serif !important" }}>{store.store}</td>
                        <td className="py-2 text-right font-mono text-[12px] text-[#2ECC71]" style={{ fontFamily: "Arial, sans-serif !important" }}>{formatCurrency(store.sales)}</td>
                        <td className="py-2 text-right font-mono text-[12px] text-[#E8621A]" style={{ fontFamily: "Arial, sans-serif !important" }}>{store.transactions}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-8 text-[#9CA3AF]">No hay ventas en este período</div>
              )}
            </div>
          </div>
        </article>
      </section>

      {/* Tendencia y Top productos */}
      <section className="grid grid-cols-2 gap-[6px] mb-[5px]">
        {/* Tendencia diaria - SOLO DÍAS CON VENTAS > 0 */}
        <article className="bt-panel !rounded-[12px] flex flex-col shadow-[0_16px_45px_rgba(0,0,0,0.24)] pt-4 pb-4" style={{ borderRadius: "12px !important" }}>
          <div className="w-[88%] mx-auto flex flex-col h-full">
            <h2 className="mb-4 text-[20px] font-[900] uppercase text-white tracking-tight" style={{ fontFamily: "Arial, sans-serif !important", transform: "scale(0.9, 1.1)", transformOrigin: "left center", textShadow: "0 0 1px rgba(255,255,255,0.3)" }}>
              Tendencia - Ventas diarias
            </h2>
            {filteredSalesTrend.length > 0 ? (
              <div className="space-y-3">
                {filteredSalesTrend.map((point) => (
                  <div key={point.date}>
                    <div className="mb-1 flex items-center justify-between gap-3">
                      <span className="font-mono text-[11px] text-[#CBD5E1]" style={{ fontFamily: "Arial, sans-serif !important" }}>{point.date}</span>
                      <span className="font-mono text-[11px] text-white" style={{ fontFamily: "Arial, sans-serif !important" }}>{formatCurrency(point.total)}</span>
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
            ) : (
              <div className="text-center py-8 text-[#9CA3AF]">
                No hay ventas en este período
              </div>
            )}
          </div>
        </article>

        {/* Top productos (sin cambios) */}
        <article className="bt-panel !rounded-[12px] flex flex-col shadow-[0_16px_45px_rgba(0,0,0,0.24)] pt-4 pb-4" style={{ borderRadius: "12px !important" }}>
          <div className="w-[88%] mx-auto flex flex-col h-full">
            <h2 className="mb-4 text-[20px] font-[900] uppercase text-white tracking-tight" style={{ fontFamily: "Arial, sans-serif !important", transform: "scale(0.9, 1.1)", transformOrigin: "left center", textShadow: "0 0 1px rgba(255,255,255,0.3)" }}>
              Top productos más vendidos
            </h2>
            <div className="overflow-x-auto">
              {hasSales && topSellers.length > 0 ? (
                <table className="w-full border-separate border-spacing-y-2">
                  <thead>
                    <tr>
                      <th className="pb-2 text-left font-mono text-[10px] tracking-[0.26em] text-[#8B95A1] uppercase" style={{ fontFamily: "Arial, sans-serif !important" }}>Modelo</th>
                      <th className="pb-2 text-left font-mono text-[10px] tracking-[0.26em] text-[#8B95A1] uppercase" style={{ fontFamily: "Arial, sans-serif !important" }}>Talla</th>
                      <th className="pb-2 text-right font-mono text-[10px] tracking-[0.26em] text-[#8B95A1] uppercase" style={{ fontFamily: "Arial, sans-serif !important" }}>Cant.</th>
                      <th className="pb-2 text-right font-mono text-[10px] tracking-[0.26em] text-[#8B95A1] uppercase" style={{ fontFamily: "Arial, sans-serif !important" }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topSellers.map((item, idx) => (
                      <tr key={idx} className="border-b border-[#222222] last:border-0">
                        <td className="py-2 text-left font-sans text-[13px] font-semibold text-white" style={{ fontFamily: "Arial, sans-serif !important" }}>{item.modelName}</td>
                        <td className="py-2 text-left font-mono text-[11px] text-[#CBD5E1]" style={{ fontFamily: "Arial, sans-serif !important" }}>{item.size}</td>
                        <td className="py-2 text-right font-mono text-[11px] text-[#E8621A]" style={{ fontFamily: "Arial, sans-serif !important" }}>{item.quantity}</td>
                        <td className="py-2 text-right font-mono text-[11px] text-[#2ECC71]" style={{ fontFamily: "Arial, sans-serif !important" }}>{formatCurrency(item.total)}</td> 
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-8 text-[#9CA3AF]">No hay productos vendidos en este período</div>
              )}
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}