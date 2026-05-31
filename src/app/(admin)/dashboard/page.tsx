import Link from "next/link";
import { cookies } from "next/headers";
import { prisma } from "../../../lib/prisma";
import { verifyAuthToken } from "../../../lib/token-utils";
import { formatCurrency } from "../../../lib/utils";

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

function getMonday(date: Date) {
  const monday = new Date(date);
  const day = monday.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  monday.setDate(monday.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function formatVsYesterday(current: number, previous: number) {
  if (previous === 0 && current === 0) return "vs ayer 0%";
  if (previous === 0) return "vs ayer +100%";
  const diff = ((current - previous) / previous) * 100;
  const signal = diff >= 0 ? "+" : "";
  return `vs ayer ${signal}${diff.toFixed(0)}%`;
}

function createChartPoints(values: number[]) {
  const width = 560;
  const height = 180;
  const paddingX = 28;
  const paddingTop = 18;
  const paddingBottom = 28;
  const maxValue = Math.max(...values, 1);
  const innerWidth = width - paddingX * 2;
  const innerHeight = height - paddingTop - paddingBottom;

  return values.map((value, index) => {
    const x = paddingX + (innerWidth / Math.max(values.length - 1, 1)) * index;
    const y = paddingTop + innerHeight - (value / maxValue) * innerHeight;
    return { x, y, value };
  });
}

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("bt_auth")?.value;
  const authPayload = token ? await verifyAuthToken(token) : null;

  if (!authPayload) {
    return <div className="p-8 text-white">No autorizado</div>;
  }

  const { role, storeId, storeName } = authPayload;
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const endOfYesterday = new Date(startOfYesterday);
  endOfYesterday.setHours(23, 59, 59, 999);

  const startOfWeek = getMonday(now);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const salesWhere = role === "MANAGER" && storeId ? { storeId } : {};
  const inventoryWhere = role === "MANAGER" && storeId ? { storeId } : {};

  // ------------- CONSULTAS SECUENCIALES (evitan saturar conexiones) -------------
  // 1. Ventas hoy
  const salesToday = await prisma.sale.aggregate({
    _sum: { total: true },
    where: {
      ...salesWhere,
      createdAt: { gte: startOfToday, lte: endOfToday },
    },
  });
  // 2. Ventas ayer
  const salesYesterday = await prisma.sale.aggregate({
    _sum: { total: true },
    where: {
      ...salesWhere,
      createdAt: { gte: startOfYesterday, lte: endOfYesterday },
    },
  });
  // 3. Transacciones hoy
  const transactionsToday = await prisma.sale.count({
    where: {
      ...salesWhere,
      createdAt: { gte: startOfToday, lte: endOfToday },
    },
  });
  // 4. Stock bajo
  const lowStockCount = await prisma.inventory.count({
    where: { ...inventoryWhere, quantity: { lte: 2 } },
  });
  // 5. Stock agotado
  const outOfStockCount = await prisma.inventory.count({
    where: { ...inventoryWhere, quantity: 0 },
  });
  // 6. Conteo de sucursales
  const storesCount = role === "ADMIN" ? await prisma.store.count() : 1;
  // 7. Ventas recientes (últimas 5)
  const recentSales = await prisma.sale.findMany({
    where: salesWhere,
    include: { store: true },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
  // 8. Ventas semanales (para la gráfica)
  const weeklySales = await prisma.sale.findMany({
    where: {
      ...salesWhere,
      createdAt: { gte: startOfWeek, lte: endOfWeek },
    },
    select: { total: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  // 9. Top productos (más vendidos en la semana)
  const saleItemsThisWeek = await prisma.saleItem.findMany({
    where: {
      sale: {
        ...salesWhere,
        createdAt: { gte: startOfWeek, lte: endOfWeek },
      },
    },
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

  // Procesar top productos
  const topMap = new Map<string, { name: string; size: string; quantity: number; total: number }>();
  for (const item of saleItemsThisWeek) {
    const key = `${item.variant.product.name}-${item.variant.size}`;
    const qty = item.quantity;
    const total = Number(item.salePrice) * qty;
    const existing = topMap.get(key);
    if (existing) {
      existing.quantity += qty;
      existing.total += total;
    } else {
      topMap.set(key, {
        name: item.variant.product.name,
        size: item.variant.size,
        quantity: qty,
        total,
      });
    }
  }
  const topSellers = Array.from(topMap.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  // -----------------------------------------------------------------

  const weekdays = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];
  const weeklyChart = weekdays.map((label, index) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + index);
    const value = weeklySales
      .filter(sale => sale.createdAt.toDateString() === date.toDateString())
      .reduce((sum, sale) => sum + Number(sale.total), 0);
    return { label, value };
  });

  const chartCoordinates = createChartPoints(weeklyChart.map(p => p.value));
  const chartPolyline = chartCoordinates.map(p => `${p.x},${p.y}`).join(" ");
  const salesTodayValue = Number(salesToday._sum.total || 0);
  const salesYesterdayValue = Number(salesYesterday._sum.total || 0);
  const activeStoreLabel = role === "MANAGER" ? storeName || "Sucursal activa" : "Operativas";
  const storeRatio = role === "MANAGER" ? "1/1" : `${storesCount}/${storesCount}`;

  return (
    <div className="flex-1 min-h-screen max-w-full bg-[#060606] px-6 py-8 text-white overflow-hidden m-[5px]">
      {/* Cabecera */}
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
            {formatLowercaseDate(now)}
          </p>
        </div>
        <div className="flex items-center gap-[5px] mt-1">
          <Link href="/reports" className="flex items-center gap-3 mb-[2.5px] rounded-[10px] border border-[#333333] bg-[#1A1A1A] px-[10px] py-[7px] text-sm text-[#D1D5DB]">
            📊 Reportes
          </Link>
          <Link href="/terminal" className="bt-button-primary rounded-[14px] text-xs uppercase tracking-[0.18em]">
            Abrir POS
          </Link>
        </div>
      </div>

      {/* Tarjetas KPI */}
      <section className="grid grid-cols-4 gap-[15px] mb-8">
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

      {/* Primera fila de tarjetas grandes */}
      <section className="grid grid-cols-2 gap-[15px] mb-[15px]">
        {/* Ventas semanales */}
        <article className="bt-panel rounded-[24px] flex flex-col shadow-[0_16px_45px_rgba(0,0,0,0.24)] min-h-[420px] pt-4 pb-4">
          <div className="w-[88%] mx-auto flex flex-col h-full">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h2 className="text-[20px] font-[900] uppercase text-white tracking-tight" style={{ fontFamily: "Arial, sans-serif", transform: "scale(0.9, 1.1)", transformOrigin: "left center" }}>
                📉 Ventas semanales
              </h2>
              <span className="inline-block rounded-full bg-[#2C2418] px-3 py-1.5 text-[12px] font-bold uppercase tracking-[0.2em] text-[#C2410C] shadow-sm">
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
                🏆 Top productos
              </h2>
              <span className="inline-block rounded-full bg-[#1E2A1C] px-3 py-1.5 text-[12px] font-bold uppercase tracking-[0.2em] text-[#2ECC71] shadow-sm">
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

      {/* Segunda fila de tarjetas grandes */}
      <section className="grid grid-cols-2 gap-[15px]">
        {/* Ventas recientes */}
        <article className="bt-panel rounded-[24px] flex flex-col shadow-[0_16px_45px_rgba(0,0,0,0.24)] overflow-hidden min-h-[260px] pt-4 pb-4">
          <div className="w-[88%] mx-auto flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[20px] font-[900] uppercase text-white tracking-tight" style={{ fontFamily: "Arial, sans-serif", transform: "scale(0.9, 1.1)", transformOrigin: "left center" }}>
                🕒 Ventas recientes
              </h2>
              <button className="rounded-[5px] border border-[#4B5563] bg-[#111111] px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-[#D1D5DB] font-[900] transition-colors hover:border-[#6B7280] hover:text-white">
                Ver todas →
              </button>
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
              <h2 className="text-[20px] font-[900] uppercase text-white tracking-tight" style={{ fontFamily: "Arial, sans-serif", transform: "scale(0.9, 1.1)", transformOrigin: "left center" }}>
                ⚠️ Alertas de stock
              </h2>
              <button className="rounded-[5px] border border-[#4B5563] bg-[#111111] px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-[#D1D5DB] font-[900] transition-colors hover:border-[#6B7280] hover:text-white">
                Gestionar →
              </button>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <label className="flex items-center gap-3 cursor-default">
                <input type="checkbox" checked={lowStockCount === 0} readOnly className="h-4 w-4 rounded border-[#333333] bg-[#242424] accent-[#2ECC71] pointer-events-none" />
                <span className={`text-[13px] font-semibold ${lowStockCount === 0 ? "text-[#2ECC71]" : "text-[#E8621A]"}`}>
                  {lowStockCount === 0 ? "Todo en orden" : `${lowStockCount} alertas de stock`}
                </span>
              </label>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}