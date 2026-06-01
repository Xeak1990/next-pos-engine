// app/(admin)/dashboard/page.tsx
import Link from "next/link";
import { cookies } from "next/headers";
import { prisma } from "../../../lib/prisma";
import { verifyAuthToken } from "../../../lib/token-utils";
import { formatCurrency } from "../../../lib/utils";
import { getMexicoMonday } from "../../../lib/date";

export const revalidate = 3600;

// --------------------------------------------------------------
// Funciones auxiliares
// --------------------------------------------------------------
function getUTCRangeForMexicoDay(mexicoDate: Date) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const [year, month, day] = formatter.format(mexicoDate).split("-").map(Number);
  const startUTC = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  const endUTC = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
  return { startUTC, endUTC };
}

function getUTCRangeForMexicoYesterday(nowMexico: Date) {
  const yesterday = new Date(nowMexico);
  yesterday.setDate(yesterday.getDate() - 1);
  return getUTCRangeForMexicoDay(yesterday);
}

function getUTCRangeForMexicoWeek() {
  const mondayMexico = getMexicoMonday();
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const [year, month, day] = formatter.format(mondayMexico).split("-").map(Number);
  const startUTC = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  const endUTC = new Date(Date.UTC(year, month - 1, day + 6, 23, 59, 59, 999));
  return { startUTC, endUTC };
}

// Convierte una fecha (almacenada en UTC) a string YYYY-MM-DD en horario México
function toMexicoDateString(date: Date): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(date);
}

// Obtiene la fecha actual en México (a la medianoche) sin afectar la hora local
function getCurrentMexicoDate(): Date {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const [year, month, day] = formatter.format(new Date()).split("-").map(Number);
  return new Date(year, month - 1, day);
}

function getCurrentMexicoDateFormatted() {
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: "America/Mexico_City",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date()).toLowerCase();
}

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("bt_auth")?.value;
  const authPayload = token ? await verifyAuthToken(token) : null;

  if (!authPayload) {
    return <div className="p-8 text-white">No autorizado</div>;
  }

  const { role, storeId, storeName } = authPayload;
  const nowMexico = getCurrentMexicoDate(); // fecha actual en México (medianoche)

  const { startUTC: startOfTodayUTC, endUTC: endOfTodayUTC } = getUTCRangeForMexicoDay(nowMexico);
  const { startUTC: startOfYesterdayUTC, endUTC: endOfYesterdayUTC } = getUTCRangeForMexicoYesterday(nowMexico);
  const { startUTC: startOfWeekUTC, endUTC: endOfWeekUTC } = getUTCRangeForMexicoWeek();

  const salesWhere = role === "MANAGER" && storeId ? { storeId } : {};
  const inventoryWhere = role === "MANAGER" && storeId ? { storeId } : {};

  // ========== Métricas KPI ==========
  const salesToday = await prisma.sale.aggregate({
    _sum: { total: true },
    where: { ...salesWhere, createdAt: { gte: startOfTodayUTC, lte: endOfTodayUTC } },
  });
  const salesYesterday = await prisma.sale.aggregate({
    _sum: { total: true },
    where: { ...salesWhere, createdAt: { gte: startOfYesterdayUTC, lte: endOfYesterdayUTC } },
  });
  const transactionsToday = await prisma.sale.count({
    where: { ...salesWhere, createdAt: { gte: startOfTodayUTC, lte: endOfTodayUTC } },
  });
  const lowStockCount = await prisma.inventory.count({
    where: { ...inventoryWhere, quantity: { lte: 2 } },
  });
  const outOfStockCount = await prisma.inventory.count({
    where: { ...inventoryWhere, quantity: 0 },
  });
  const storesCount = role === "ADMIN" ? await prisma.store.count() : 1;

  // ========== Alertas de stock ==========
  const criticalItems = await prisma.inventory.findMany({
    where: { ...inventoryWhere, quantity: 0 },
    select: {
      quantity: true,
      store: { select: { name: true } },
      variant: {
        select: {
          size: true,
          color: true,
          product: { select: { name: true, brand: true } },
        },
      },
    },
    orderBy: { variant: { product: { name: "asc" } } },
    take: 20,
  });

  const lowStockItems = await prisma.inventory.findMany({
    where: { ...inventoryWhere, quantity: { gte: 1, lte: 5 } },
    select: {
      quantity: true,
      store: { select: { name: true } },
      variant: {
        select: {
          size: true,
          color: true,
          product: { select: { name: true, brand: true } },
        },
      },
    },
    orderBy: { quantity: "asc" },
    take: 20,
  });

  // ========== Ventas recientes ==========
  const recentSales = await prisma.sale.findMany({
    where: salesWhere,
    select: {
      id: true,
      total: true,
      createdAt: true,
      store: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  // ========== Ventas semanales (gráfica) ==========
  const weeklySalesRaw = await prisma.sale.findMany({
    where: { ...salesWhere, createdAt: { gte: startOfWeekUTC, lte: endOfWeekUTC } },
    select: { total: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  // Agrupar por día en México
  const salesByDay = new Map<string, number>();
  for (const sale of weeklySalesRaw) {
    const dayKey = toMexicoDateString(sale.createdAt);
    salesByDay.set(dayKey, (salesByDay.get(dayKey) || 0) + Number(sale.total));
  }

  // Generar los días de la semana (lunes a domingo) en México
  const weekdays = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];
  const mondayMexico = getMexicoMonday();
  const weeklyChart = weekdays.map((_, index) => {
    const date = new Date(mondayMexico);
    date.setDate(date.getDate() + index);
    const dayKey = toMexicoDateString(date);
    return { label: weekdays[index], value: salesByDay.get(dayKey) || 0 };
  });

  // ========== Top productos ==========
  const topVariants = await prisma.saleItem.groupBy({
    by: ["variantId"],
    where: {
      sale: { ...salesWhere, createdAt: { gte: startOfWeekUTC, lte: endOfWeekUTC } },
    },
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: 5,
  });

  const variantIds = topVariants.map(v => v.variantId);
  const topSellers: { name: string; size: string; quantity: number; total: number }[] = [];
  if (variantIds.length > 0) {
    const variantsWithProducts = await prisma.variant.findMany({
      where: { id: { in: variantIds } },
      select: {
        id: true,
        size: true,
        price: true,
        product: { select: { name: true } },
      },
    });
    const variantMap = new Map(variantsWithProducts.map(v => [v.id, v]));
    for (const item of topVariants) {
      const variant = variantMap.get(item.variantId);
      if (variant) {
        const qty = item._sum.quantity || 0;
        const total = Number(variant.price) * qty;
        topSellers.push({
          name: variant.product.name,
          size: variant.size,
          quantity: qty,
          total,
        });
      }
    }
    topSellers.sort((a, b) => b.quantity - a.quantity);
  }

  // ========== Preparar coordenadas para la gráfica ==========
  const chartCoordinates = (() => {
    const width = 560;
    const height = 180;
    const paddingX = 28;
    const paddingTop = 18;
    const paddingBottom = 28;
    const values = weeklyChart.map(p => p.value);
    const maxValue = Math.max(...values, 1);
    const innerWidth = width - paddingX * 2;
    const innerHeight = height - paddingTop - paddingBottom;
    return values.map((value, idx) => ({
      x: paddingX + (innerWidth / Math.max(values.length - 1, 1)) * idx,
      y: paddingTop + innerHeight - (value / maxValue) * innerHeight,
      value,
    }));
  })();
  const chartPolyline = chartCoordinates.map(p => `${p.x},${p.y}`).join(" ");

  // ========== Valores para la UI ==========
  const salesTodayValue = Number(salesToday._sum.total || 0);
  const salesYesterdayValue = Number(salesYesterday._sum.total || 0);
  const activeStoreLabel = role === "MANAGER" ? storeName || "Sucursal activa" : "Operativas";
  const storeRatio = role === "MANAGER" ? "1/1" : `${storesCount}/${storesCount}`;

  const formatVsYesterday = (current: number, previous: number) => {
    if (previous === 0 && current === 0) return "vs ayer 0%";
    if (previous === 0) return "vs ayer +100%";
    const diff = ((current - previous) / previous) * 100;
    const signal = diff >= 0 ? "+" : "";
    return `vs ayer ${signal}${diff.toFixed(0)}%`;
  };

  return (
    <div className="flex-1 min-h-screen max-w-full bg-[#060606] px-6 py-8 text-white overflow-hidden m-[5px]">
      <div className="flex w-full items-start justify-between mb-[15px]">
        <div className="flex flex-col">
          <nav className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#666666]">
            <Link href="/dashboard" className="hover:text-white">Principal</Link>
            <span>/</span>
            <span className="text-[#e8621a]">Dashboard</span>
          </nav>
          <h1 className="text-[38px] font-[900] uppercase text-white leading-none tracking-tight"
            style={{ fontFamily: "Arial, sans-serif", transform: "scale(0.85, 1.15)", transformOrigin: "left center", WebkitTextStroke: "1.5px white" }}>
            Dashboard
          </h1>
          <p className="mt-[-8px] text-[16px] font-medium text-[#9CA3AF] lowercase opacity-80">
            {getCurrentMexicoDateFormatted()}
          </p>
        </div>
        <div className="flex items-center gap-[5px] mt-1">
          <Link href="/reports" className="flex items-center gap-3 mb-[2.5px] rounded-[10px] border border-[#333333] bg-[#1A1A1A] px-[10px] py-[7px] text-sm text-[#D1D5DB]">
            Reportes
          </Link>
          <Link href="/terminal" className="bt-button-primary rounded-[14px] text-xs uppercase tracking-[0.18em]">
            Abrir POS
          </Link>
        </div>
      </div>

      {/* Tarjetas KPI */}
      <section className="grid grid-cols-4 gap-[15px] mb-[15px]">
        {/* Ventas hoy */}
        <article className="bt-panel rounded-[22px] flex flex-col shadow-[0_12px_30px_rgba(0,0,0,0.22)] overflow-hidden relative" style={{ height: "125px", padding: "0" }}>
          <div className="w-[88%] mx-auto pt-4 flex justify-between items-start z-10">
            <p className="text-[12px] font-semibold text-[#9CA3AF] font-sans">VENTAS HOY</p>
          </div>
          <div className="absolute inset-0 flex items-center justify-start pl-[6%] pointer-events-none">
            <p className="text-[26px] font-[900] text-[#e8621a] uppercase flex items-center h-full" style={{ fontFamily: "Arial, sans-serif", letterSpacing: "-0.04em", transform: "scaleY(1.35) translateY(15px)", WebkitTextStroke: "1.4px #e8621a" }}>
              {formatCurrency(salesTodayValue)}
            </p>
          </div>
          <div className="w-[88%] mx-auto pb-4 mt-auto z-10">
            <p className="text-[11px] font-semibold text-[#9CA3AF] font-sans">{formatVsYesterday(salesTodayValue, salesYesterdayValue)}</p>
          </div>
        </article>

        {/* Transacciones */}
        <article className="bt-panel rounded-[22px] flex flex-col shadow-[0_12px_30px_rgba(0,0,0,0.22)] overflow-hidden relative" style={{ height: "125px", padding: "0" }}>
          <div className="w-[88%] mx-auto pt-4 flex justify-between items-start z-10">
            <p className="text-[12px] font-semibold text-[#9CA3AF] font-sans">TRANSACCIONES</p>
          </div>
          <div className="absolute inset-0 flex items-center justify-start pl-[6%] pointer-events-none">
            <p className="text-[26px] font-[900] text-white uppercase flex items-center h-full" style={{ fontFamily: "Arial, sans-serif", letterSpacing: "-0.04em", transform: "scaleY(1.35) translateY(15px)" }}>
              {transactionsToday}
            </p>
          </div>
          <div className="w-[88%] mx-auto pb-4 mt-auto z-10">
            <p className="text-[11px] font-semibold text-[#9CA3AF] font-sans">Hoy</p>
          </div>
        </article>

        {/* Stock bajo */}
        <article className="bt-panel rounded-[22px] flex flex-col shadow-[0_12px_30px_rgba(0,0,0,0.22)] overflow-hidden relative" style={{ height: "125px", padding: "0" }}>
          <div className="w-[88%] mx-auto pt-4 flex justify-between items-start z-10">
            <p className="text-[12px] font-semibold text-[#9CA3AF] font-sans">STOCK BAJO</p>
          </div>
          <div className="absolute inset-0 flex items-center justify-start pl-[6%] pointer-events-none">
            <p className="text-[26px] font-[900] text-[#F39C12] uppercase flex items-center h-full" style={{ fontFamily: "Arial, sans-serif", letterSpacing: "-0.04em", transform: "scaleY(1.35) translateY(15px)" }}>
              {lowStockCount}
            </p>
          </div>
          <div className="w-[88%] mx-auto pb-4 mt-auto z-10">
            <p className="text-[11px] font-semibold text-[#9CA3AF] font-sans">{outOfStockCount} agotados</p>
          </div>
        </article>

        {/* Sucursales */}
        <article className="bt-panel rounded-[22px] flex flex-col shadow-[0_12px_30px_rgba(0,0,0,0.22)] overflow-hidden relative" style={{ height: "125px", padding: "0" }}>
          <div className="w-[88%] mx-auto pt-4 flex justify-between items-start z-10">
            <p className="text-[12px] font-semibold text-[#9CA3AF] font-sans">SUCURSALES</p>
          </div>
          <div className="absolute inset-0 flex items-center justify-start pl-[6%] pointer-events-none">
            <p className="text-[26px] font-[900] text-[#2ECC71] uppercase flex items-center h-full" style={{ fontFamily: "Arial, sans-serif", letterSpacing: "-0.04em", transform: "scaleY(1.35) translateY(15px)" }}>
              {storeRatio}
            </p>
          </div>
          <div className="w-[88%] mx-auto pb-4 mt-auto z-10">
            <p className="truncate text-[11px] font-semibold text-[#9CA3AF] font-sans">{activeStoreLabel}</p>
          </div>
        </article>
      </section>

      {/* Gráfica y Top productos */}
      <section className="grid grid-cols-2 gap-[15px] mb-[15px]">
        {/* Ventas semanales */}
        <article className="bt-panel rounded-[24px] flex flex-col shadow-[0_16px_45px_rgba(0,0,0,0.24)] min-h-[420px] pt-4 pb-4">
          <div className="w-[88%] mx-auto flex flex-col h-full">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h2 className="text-[20px] font-[900] uppercase text-white tracking-tight" style={{ fontFamily: "Arial, sans-serif", transform: "scale(0.9, 1.1)", transformOrigin: "left center" }}>
                Ventas semanales
              </h2>
              <span className="inline-block rounded-full px-3 py-1 font-mono text-[12px] font-bold uppercase tracking-[0.2em] shadow-sm" style={{ backgroundColor: "#E8621A15", color: "#E8621A", borderRadius: "9999px", padding: "6px 12px", lineHeight: "1", boxShadow: "inset 0 1px 1px rgba(255,255,255,0.05), 0 2px 4px rgba(0,0,0,0.2)" }}>
                Esta semana
              </span>
            </div>
            <div className="relative flex-1 overflow-hidden">
              <svg viewBox="0 0 560 180" className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
                {[0, 1, 2, 3].map(line => {
                  const y = 18 + line * 40;
                  return <line key={line} x1="28" y1={y} x2="532" y2={y} stroke="#2A2A2A" strokeWidth="1" strokeDasharray="4 6" />;
                })}
                <polyline fill="none" stroke="#E8621A" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" points={chartPolyline} />
                {chartCoordinates.map((point, idx) => (
                  <circle key={idx} cx={point.x} cy={point.y} r="3" fill="#FFFFFF" stroke="#E8621A" strokeWidth="1" />
                ))}
              </svg>
            </div>
            <div className="w-full flex justify-between px-7 pt-2 text-[10px] font-mono text-[#888888]">
              {weeklyChart.map((point, idx) => (
                <span key={point.label} className={idx === 6 ? "text-[#E8621A] font-bold" : ""}>{point.label}</span>
              ))}
            </div>
          </div>
        </article>

        {/* Top productos */}
        <article className="bt-panel rounded-[24px] flex flex-col shadow-[0_16px_45px_rgba(0,0,0,0.24)] min-h-[420px] pt-4 pb-4">
          <div className="w-[88%] mx-auto flex flex-col h-full">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h2 className="text-[20px] font-[900] uppercase text-white tracking-tight" style={{ fontFamily: "Arial, sans-serif", transform: "scale(0.9, 1.1)", transformOrigin: "left center" }}>
                Top productos
              </h2>
              <span className="inline-block rounded-full px-3 py-1 font-mono text-[12px] font-bold uppercase tracking-[0.2em] shadow-sm" style={{ backgroundColor: "#2ECC7115", color: "#2ECC71", borderRadius: "9999px", padding: "6px 12px", lineHeight: "1", boxShadow: "inset 0 1px 1px rgba(255,255,255,0.05), 0 2px 4px rgba(0,0,0,0.2)" }}>
                Más vendidos
              </span>
            </div>
            <div className="flex-1 overflow-auto">
              {topSellers.length > 0 ? (
                <table className="w-full border-separate border-spacing-y-2">
                  <thead>
                    <tr>
                      <th className="pb-2 text-left font-mono text-[10px] tracking-[0.26em] text-[#8B95A1] uppercase">Modelo</th>
                      <th className="pb-2 text-left font-mono text-[10px] tracking-[0.26em] text-[#8B95A1] uppercase">Talla</th>
                      <th className="pb-2 text-right font-mono text-[10px] tracking-[0.26em] text-[#8B95A1] uppercase">Cant.</th>
                      <th className="pb-2 text-right font-mono text-[10px] tracking-[0.26em] text-[#8B95A1] uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topSellers.map((item, idx) => (
                      <tr key={idx} className="border-b border-[#222222] last:border-0">
                        <td className="py-2 text-left font-sans text-[13px] font-semibold text-white">{item.name}</td>
                        <td className="py-2 text-left font-mono text-[11px] text-[#CBD5E1]">{item.size}</td>
                        <td className="py-2 text-right font-mono text-[11px] text-[#E8621A]">{item.quantity}</td>
                        <td className="py-2 text-right font-mono text-[11px] text-[#2ECC71]">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="flex items-center justify-center h-full text-[13px] font-semibold text-[#9CA3AF]">Sin ventas esta semana</div>
              )}
            </div>
          </div>
        </article>
      </section>

      {/* Ventas recientes y Alertas de stock */}
      <section className="grid grid-cols-2 gap-[15px]">
        {/* Ventas recientes */}
        <article className="bt-panel rounded-[24px] flex flex-col shadow-[0_16px_45px_rgba(0,0,0,0.24)] overflow-hidden min-h-[260px] pt-4 pb-4">
          <div className="w-[88%] mx-auto flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[20px] font-[900] uppercase text-white tracking-tight" style={{ fontFamily: "Arial, sans-serif", transform: "scale(0.9, 1.1)", transformOrigin: "left center" }}>
                Ventas recientes
              </h2>
              <Link href="/reports" className="rounded-[5px] border border-[#4B5563] bg-[#111111] px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-[#D1D5DB] font-[900] transition-colors hover:border-[#6B7280] hover:text-white">
                Ver todas →
              </Link>
            </div>
            <div className="flex-1 overflow-auto">
              <table className="w-full border-separate border-spacing-y-2">
                <thead>
                  <tr>
                    <th className="pb-2 text-left font-mono text-[10px] tracking-[0.26em] text-[#8B95A1] uppercase">FOLIO</th>
                    <th className="pb-2 text-left font-mono text-[10px] tracking-[0.26em] text-[#8B95A1] uppercase">SUCURSAL</th>
                    <th className="pb-2 text-left font-mono text-[10px] tracking-[0.26em] text-[#8B95A1] uppercase">FECHA</th>
                    <th className="pb-2 text-right font-mono text-[10px] tracking-[0.26em] text-[#8B95A1] uppercase">TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSales.length > 0 ? (
                    recentSales.slice(0, 3).map(sale => (
                      <tr key={sale.id} className="border-b border-[#222222] last:border-0">
                        <td className="py-1.5 font-mono text-[11px] text-white">VTA-{sale.id.slice(-4).toUpperCase()}</td>
                        <td className="py-1.5 text-[11px] text-[#CBD5E1] truncate max-w-[100px]">{sale.store.name}</td>
                        <td className="py-1.5 font-mono text-[10px] text-[#888888]">{new Intl.DateTimeFormat("es-MX", { dateStyle: "short" }).format(sale.createdAt)}</td>
                        <td className="py-1.5 text-right font-mono text-[11px] text-[#E8621A]">{formatCurrency(Number(sale.total))}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={4} className="py-4 text-center text-[10px] text-[#888888] font-mono">Sin transacciones hoy</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </article>

        {/* Alertas de stock */}
        <article className="bt-panel rounded-[24px] flex flex-col shadow-[0_16px_45px_rgba(0,0,0,0.24)] min-h-[260px] pt-4 pb-4">
          <div className="w-[88%] mx-auto flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[20px] font-[900] uppercase text-white tracking-tight"
                style={{ fontFamily: "Arial, sans-serif", transform: "scale(0.9, 1.1)", transformOrigin: "left center" }}>
                Alertas de stock
              </h2>
              <Link href="/inventory" className="rounded-[5px] border border-[#4B5563] bg-[#111111] px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-[#D1D5DB] font-[900] transition-colors hover:border-[#6B7280] hover:text-white">
                Gestionar →
              </Link>
            </div>
            <div className="flex-1 overflow-y-auto">
              {criticalItems.length === 0 && lowStockItems.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <span className="text-[13px] font-semibold text-[#2ECC71]">✓ Todo en orden</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Productos críticos (0 stock) */}
                  {criticalItems.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2 sticky top-0 bg-[#060606] py-1">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_6px_#ef4444]" />
                        <span className="text-xs font-bold uppercase tracking-wider text-red-400">Crítico (sin stock)</span>
                      </div>
                      <ul className="space-y-2 text-[11px] text-[#CBD5E1]">
                        {criticalItems.map((inv, idx) => (
                          <li key={idx} className="flex justify-between items-start gap-2">
                            <div className="flex-1">
                              <span className="font-medium text-white">{inv.variant.product.brand} {inv.variant.product.name}</span>
                              <div className="text-[10px] text-[#9CA3AF]">{inv.variant.color ? `${inv.variant.color} • ` : ""}Talla {inv.variant.size} • {inv.store.name}</div>
                            </div>
                            <span className="text-red-400 font-mono whitespace-nowrap">0 uds</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Productos con stock bajo (1-5) */}
                  {lowStockItems.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2 sticky top-0 bg-[#060606] py-1">
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500 shadow-[0_0_6px_#eab308]" />
                        <span className="text-xs font-bold uppercase tracking-wider text-yellow-400">Atención (stock bajo)</span>
                      </div>
                      <ul className="space-y-2 text-[11px] text-[#CBD5E1]">
                        {lowStockItems.map((inv, idx) => (
                          <li key={idx} className="flex justify-between items-start gap-2">
                            <div className="flex-1">
                              <span className="font-medium text-white">{inv.variant.product.brand} {inv.variant.product.name}</span>
                              <div className="text-[10px] text-[#9CA3AF]">{inv.variant.color ? `${inv.variant.color} • ` : ""}Talla {inv.variant.size} • {inv.store.name}</div>
                            </div>
                            <span className="text-yellow-400 font-mono whitespace-nowrap">{inv.quantity} uds</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}